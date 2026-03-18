import {
  DailyTaskCompletionStatus,
  DailyLog,
  PetSkin,
  PetSpecies,
  PetStage,
  Prisma,
  Profile,
  RedeemCodeStatus,
  ShopItemKind,
  UserPet,
  User,
  XpLedgerScope,
} from "@prisma/client";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { addDaysToDateKey, getShanghaiDateParts } from "@/lib/time";
import {
  calculateNextStreak,
  calculateRewards,
  getDisplayLevel,
  getNextMakeupCardPrice,
  getShopItemPrice,
  mapTaskDefinitionToDailyTaskSnapshot,
  normalizeTaskSelection,
  parseCompletedTaskIds,
  parseStringArrayJson,
  parseTasksJson,
  serializeTaskSnapshots,
  shouldResetStreakForMissedDay,
} from "@/lib/game";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetImageKey, getPetProgress } from "@/lib/pets";
import { PET_3D_PLACEHOLDER_MODEL } from "@/modules/pet3d/pet3d";

export const PET_STAGE_PLACEHOLDER_IMAGE = "/pet-stage-placeholder.svg";

const SHOP_ITEM_INCLUDE = {
  purchases: true,
  redeemCodes: true,
  petSkin: {
    include: {
      species: true,
    },
  },
} satisfies Prisma.ShopItemInclude;

const PET_SPECIES_INCLUDE = {
  stages: {
    orderBy: { stageIndex: "asc" },
  },
} satisfies Prisma.PetSpeciesInclude;

const USER_PET_INCLUDE = {
  species: {
    include: PET_SPECIES_INCLUDE,
  },
  activeSkin: {
    include: {
      species: true,
    },
  },
} satisfies Prisma.UserPetInclude;

const USER_PET_SKIN_INCLUDE = {
  skin: {
    include: {
      species: true,
    },
  },
} satisfies Prisma.UserPetSkinInclude;

type ShopItemRecord = Prisma.ShopItemGetPayload<{
  include: typeof SHOP_ITEM_INCLUDE;
}>;

type PetSpeciesRecord = Prisma.PetSpeciesGetPayload<{
  include: typeof PET_SPECIES_INCLUDE;
}>;

type UserPetRecord = Prisma.UserPetGetPayload<{
  include: typeof USER_PET_INCLUDE;
}>;

type UserPetSkinRecord = Prisma.UserPetSkinGetPayload<{
  include: typeof USER_PET_SKIN_INCLUDE;
}>;

type TaskAccessClient = Pick<typeof prisma, "profile" | "taskDefinition" | "dailyLog">;
type PetAccessClient = Pick<typeof prisma, "petSpecies" | "userPet" | "userPetSkin">;
type LockedTaskView = {
  id: string;
  slug: string;
  nameZh: string;
  unlockHint: string;
};

type TodayTaskView = {
  id: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  exp: number;
  points: number;
  completed: boolean;
  completedAt: Date | null;
};

function withDerivedProfileLevel<T extends Pick<Profile, "exp" | "level">>(profile: T): T {
  return {
    ...profile,
    level: getDisplayLevel(profile.exp, profile.level),
  };
}

function getCompletedTaskSlugs(profile: Pick<Profile, "completedTaskSlugsJson">) {
  return parseStringArrayJson(profile.completedTaskSlugsJson);
}

function toSortedUniqueSlugs(slugs: string[]) {
  return [...new Set(slugs)].sort((left, right) => left.localeCompare(right));
}

function getCompletedTaskSlugsFromLog(log: Pick<DailyLog, "completedTaskIds" | "tasksJson">) {
  const completedIds = new Set(parseCompletedTaskIds(log as DailyLog));
  const tasks = parseTasksJson(log.tasksJson);
  return toSortedUniqueSlugs(tasks.filter((task) => completedIds.has(task.id)).map((task) => task.slug));
}

function getCompletedTaskSlugsFromTaskRecords(
  tasks: Array<{ slug: string }>,
  completions: Array<{ status: DailyTaskCompletionStatus; taskSlug: string }>,
) {
  const completedSet = new Set(
    completions.filter((completion) => completion.status === "COMPLETED").map((completion) => completion.taskSlug),
  );

  return tasks.filter((task) => completedSet.has(task.slug)).map((task) => task.slug);
}

function getTaskRewardBySlug(log: Pick<DailyLog, "tasksJson">, taskSlug: string) {
  return parseTasksJson(log.tasksJson).find((task) => task.slug === taskSlug) ?? null;
}

function buildTodayTasks(
  log: Pick<DailyLog, "tasksJson">,
  completions: Array<{ status: DailyTaskCompletionStatus; taskSlug: string; completedAt: Date | null }>,
) {
  const completionMap = new Map(
    completions.map((completion) => [completion.taskSlug, completion]),
  );

  return parseTasksJson(log.tasksJson).map((task) => {
    const completion = completionMap.get(task.slug);

    return {
      ...task,
      completed: completion?.status === "COMPLETED",
      completedAt: completion?.status === "COMPLETED" ? completion.completedAt : null,
    } satisfies TodayTaskView;
  });
}

function shouldRunCompletionIndexBackfill(
  profile: Pick<Profile, "completedTaskSlugsJson" | "completedTaskSlugsBackfilledAt">,
) {
  return getCompletedTaskSlugs(profile).length === 0 && profile.completedTaskSlugsBackfilledAt === null;
}

async function backfillCompletedTaskSlugs(
  db: TaskAccessClient,
  profile: Profile,
  userId: string,
  beforeDate?: string,
) {
  const logs = await db.dailyLog.findMany({
    where: {
      userId,
      ...(beforeDate
        ? {
            date: {
              gte: addDaysToDateKey(beforeDate, -90),
              lt: beforeDate,
            },
          }
        : {}),
    },
    select: {
      completedTaskIds: true,
      tasksJson: true,
    },
    orderBy: { date: "desc" },
    take: 90,
  });

  const completedTaskSlugs = toSortedUniqueSlugs(logs.flatMap((log) => getCompletedTaskSlugsFromLog(log)));

  const updatedProfile = await db.profile.update({
    where: { id: profile.id },
    data: {
      completedTaskSlugsJson: JSON.stringify(completedTaskSlugs),
      completedTaskSlugsBackfilledAt: new Date(),
    },
  });

  return {
    profile: updatedProfile,
    completedTaskSlugs,
  };
}

async function getCompletionIndex(
  db: TaskAccessClient,
  profile: Profile,
  userId: string,
  beforeDate?: string,
) {
  if (!shouldRunCompletionIndexBackfill(profile)) {
    return {
      profile,
      completedTaskSlugs: getCompletedTaskSlugs(profile),
    };
  }

  return backfillCompletedTaskSlugs(db, profile, userId, beforeDate);
}

async function addCompletedTaskSlugsToProfile(
  db: Pick<typeof prisma, "profile">,
  profile: Profile,
  slugs: string[],
) {
  if (slugs.length === 0) {
    return profile;
  }

  const current = getCompletedTaskSlugs(profile);
  const merged = toSortedUniqueSlugs([...current, ...slugs]);

  if (JSON.stringify(merged) === JSON.stringify(current)) {
    return profile;
  }

  return db.profile.update({
    where: { id: profile.id },
    data: {
      completedTaskSlugsJson: JSON.stringify(merged),
    },
  });
}

function getItemPurchaseCountFromPurchases(
  purchases: Array<{
    quantity: number;
    userId: string;
  }>,
  userId: string,
) {
  return purchases.reduce((total, purchase) => {
    if (purchase.userId !== userId) {
      return total;
    }

    return total + purchase.quantity;
  }, 0);
}

function toShopItemView(
  item: ShopItemRecord,
  userId: string,
  ownedSkinIds = new Set<string>(),
  ownedSpeciesIds = new Set<string>(),
) {
  const purchaseCount = getItemPurchaseCountFromPurchases(item.purchases, userId);
  const ownsSkin = item.petSkinId ? ownedSkinIds.has(item.petSkinId) : false;
  const ownsRequiredSpecies = item.petSkin?.speciesId ? ownedSpeciesIds.has(item.petSkin.speciesId) : true;

  return {
    id: item.id,
    slug: item.slug,
    nameZh: item.nameZh,
    descriptionZh: item.descriptionZh,
    kind: item.kind,
    priceBase: item.priceBase,
    priceStep: item.priceStep,
    isActive: item.isActive,
    createdAt: item.createdAt,
    purchaseCount,
    ownsSkin,
    ownsRequiredSpecies,
    petSkin: item.petSkin
      ? {
          ...item.petSkin,
        }
      : null,
    currentPrice: getShopItemPrice(item.priceBase, item.priceStep, purchaseCount),
  };
}

function sortStages(stages: PetStage[]) {
  return [...stages].sort((left, right) => left.stageIndex - right.stageIndex);
}

function resolveStageCoverImageUrl(
  stage: Pick<PetStage, "coverImageUrl">,
  species: Pick<PetSpecies, "coverImageUrl">,
) {
  return stage.coverImageUrl ?? species.coverImageUrl ?? PET_STAGE_PLACEHOLDER_IMAGE;
}

function resolveStageModelGlbUrl(
  stage: Pick<PetStage, "modelGlbUrl">,
  species: Pick<PetSpecies, "modelGlbUrl">,
) {
  return stage.modelGlbUrl ?? species.modelGlbUrl ?? PET_3D_PLACEHOLDER_MODEL;
}

function withResolvedStageAssets<T extends Pick<PetSpecies, "coverImageUrl" | "modelGlbUrl"> & { stages: PetStage[] }>(species: T) {
  return {
    ...species,
    stages: sortStages(species.stages).map((stage) => ({
      ...stage,
      coverImageUrl: resolveStageCoverImageUrl(stage, species),
      modelGlbUrl: resolveStageModelGlbUrl(stage, species),
    })),
  };
}

function getCurrentStage(stages: PetStage[], xp: number) {
  return sortStages(stages).reduce((current, stage) => (xp >= stage.minXp ? stage : current), stages[0]);
}

function isSkinUsableForPet(
  skin: Pick<PetSkin, "speciesId" | "stageIndex">,
  pet: Pick<UserPetRecord, "speciesId" | "xp"> & {
    species: {
      stages: PetStage[];
    };
  },
) {
  if (skin.speciesId && skin.speciesId !== pet.speciesId) {
    return false;
  }

  if (skin.stageIndex == null) {
    return true;
  }

  const currentStage = getCurrentStage(pet.species.stages, pet.xp);
  return currentStage.stageIndex >= skin.stageIndex;
}

function toOwnedSkinView(record: UserPetSkinRecord) {
  return {
    id: record.skin.id,
    slug: record.skin.slug,
    nameZh: record.skin.nameZh,
    descriptionZh: record.skin.descriptionZh,
    speciesId: record.skin.speciesId,
    speciesNameZh: record.skin.species?.nameZh ?? null,
    stageIndex: record.skin.stageIndex,
    imageKey: record.skin.imageKey,
    rarity: record.skin.rarity,
    isActive: record.skin.isActive,
    obtainedAt: record.obtainedAt,
  };
}

function toOwnedPetView(userPet: UserPetRecord) {
  const species = withResolvedStageAssets(userPet.species);
  const stages = species.stages;
  const progress = getPetProgress(stages, userPet.xp);
  const currentImageKey = getPetImageKey(progress.currentStage.imageKey, userPet.activeSkin);
  const currentStageCoverImageUrl = resolveStageCoverImageUrl(progress.currentStage, species);

  return {
    ...userPet,
    species,
    currentStage: progress.currentStage,
    currentStageCoverImageUrl,
    nextStage: progress.nextStage,
    progress,
    currentImageKey,
    displayName: userPet.nickname?.trim() || userPet.species.nameZh,
  };
}

async function getOwnedPetsWithStages(db: PetAccessClient, userId: string) {
  const [pets, userSkins] = await Promise.all([
    db.userPet.findMany({
      where: { userId },
      include: USER_PET_INCLUDE,
      orderBy: [{ isActive: "desc" }, { obtainedAt: "asc" }],
    }),
    db.userPetSkin.findMany({
      where: {
        userId,
        skin: {
          isActive: true,
        },
      },
      include: USER_PET_SKIN_INCLUDE,
      orderBy: [{ obtainedAt: "asc" }],
    }),
  ]);

  const ownedSkins = userSkins.map((record) => toOwnedSkinView(record as UserPetSkinRecord));

  return pets.map((pet) => {
    const normalizedPet = toOwnedPetView(pet as UserPetRecord);
    const ownedSkinsForPet = ownedSkins
      .filter((skin) => !skin.speciesId || skin.speciesId === normalizedPet.speciesId)
      .map((skin) => ({
        ...skin,
        usable: isSkinUsableForPet(skin, normalizedPet),
      }));

    return {
      ...normalizedPet,
      ownedSkins: ownedSkinsForPet,
      availableSkins: ownedSkinsForPet.filter((skin) => skin.usable),
    };
  });
}

async function getAllPetSpecies(db: Pick<typeof prisma, "petSpecies">) {
  const species = await db.petSpecies.findMany({
    where: { isActive: true },
    include: PET_SPECIES_INCLUDE,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return species.map((entry) => withResolvedStageAssets(entry)) as PetSpeciesRecord[];
}

export async function hasAnyUserPet(userId: string) {
  const pet = await prisma.userPet.findFirst({
    where: { userId },
    select: { id: true },
  });

  return pet != null;
}

export async function getStarterPetOnboardingState(userId: string) {
  const [hasPets, species] = await Promise.all([hasAnyUserPet(userId), getAllPetSpecies(prisma)]);

  return {
    hasPets,
    species,
  };
}

export async function grantStarterPet(userId: string, speciesId: string) {
  return prisma.$transaction(async (tx) => {
    const [existingPet, species, activePet] = await Promise.all([
      tx.userPet.findFirst({
        where: { userId },
        select: { id: true },
      }),
      tx.petSpecies.findFirst({
        where: {
          id: speciesId,
          isActive: true,
        },
      }),
      tx.userPet.findFirst({
        where: {
          userId,
          isActive: true,
        },
        select: { id: true },
      }),
    ]);

    if (existingPet) {
      return {
        status: "already-has-pet" as const,
      };
    }

    if (!species) {
      throw new Error(zhCN.actions.petSpeciesNotFound);
    }

    const userPet = await tx.userPet.create({
      data: {
        userId,
        speciesId: species.id,
        xp: 0,
        obtainedAt: new Date(),
        isActive: activePet == null,
      },
      include: USER_PET_INCLUDE,
    });

    return {
      status: "granted" as const,
      userPet: toOwnedPetView(userPet as UserPetRecord),
    };
  });
}

async function grantPetXpToActivePet(
  db: Pick<typeof prisma, "userPet">,
  userId: string,
  xp: number,
) {
  if (xp <= 0) {
    return null;
  }

  const activePet = await db.userPet.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  if (!activePet) {
    return null;
  }

  return db.userPet.update({
    where: { id: activePet.id },
    data: {
      xp: activePet.xp + xp,
    },
  });
}

async function getActiveShopItemsWithUserState(userId: string) {
  const [items, ownedPetSkins, ownedPets] = await Promise.all([
    prisma.shopItem.findMany({
      where: { isActive: true },
      include: {
        purchases: {
          where: { userId },
          select: {
            quantity: true,
            userId: true,
          },
        },
        redeemCodes: false,
        petSkin: {
          include: {
            species: true,
          },
        },
      },
      orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
    }),
    prisma.userPetSkin.findMany({
      where: { userId },
      select: {
        skinId: true,
      },
    }),
    prisma.userPet.findMany({
      where: { userId },
      select: {
        speciesId: true,
      },
    }),
  ]);

  const ownedSkinIds = new Set(ownedPetSkins.map((entry) => entry.skinId));
  const ownedSpeciesIds = new Set(ownedPets.map((entry) => entry.speciesId));
  return items.map((item) => toShopItemView(item as ShopItemRecord, userId, ownedSkinIds, ownedSpeciesIds));
}

async function getTaskAvailabilityForUserFromDb(
  db: TaskAccessClient,
  userId: string,
  date = getShanghaiDateParts().today,
) {
  const [profileRecord, tasks] = await Promise.all([
    db.profile.upsert({
      where: { userId },
      create: { userId, completedTaskSlugsJson: "[]", completedTaskSlugsBackfilledAt: null },
      update: {},
    }),
    db.taskDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ unlockLevel: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const { profile, completedTaskSlugs } = await getCompletionIndex(db, profileRecord, userId, date);
  const currentProfile = withDerivedProfileLevel(profile);
  const completedTaskSlugSet = new Set(completedTaskSlugs);
  const taskNameBySlug = new Map(tasks.map((task) => [task.slug, task.nameZh]));
  const unlocked = tasks.filter((task) => {
    if (currentProfile.level < task.unlockLevel) {
      return false;
    }

    if (!task.unlockAfterTaskSlug) {
      return true;
    }

    return completedTaskSlugSet.has(task.unlockAfterTaskSlug);
  });

  const unlockedSlugSet = new Set(unlocked.map((task) => task.slug));
  const locked: LockedTaskView[] = tasks
    .filter((task) => !unlockedSlugSet.has(task.slug))
    .map((task) => {
      const unlockHint =
        currentProfile.level < task.unlockLevel
          ? formatText(zhCN.today.lockedByLevel, { level: task.unlockLevel })
          : formatText(zhCN.today.lockedByTask, {
              name: taskNameBySlug.get(task.unlockAfterTaskSlug ?? "") ?? task.unlockAfterTaskSlug ?? "",
            });

      return {
        id: task.id,
        slug: task.slug,
        nameZh: task.nameZh,
        unlockHint,
      };
    });

  return {
    profile: currentProfile,
    unlocked,
    locked,
  };
}

async function getAvailableTaskDefinitionsForUserFromDb(
  db: TaskAccessClient,
  userId: string,
  date = getShanghaiDateParts().today,
) {
  const availability = await getTaskAvailabilityForUserFromDb(db, userId, date);
  return availability.unlocked;
}

export async function getAvailableTaskDefinitionsForUser(userId: string, date = getShanghaiDateParts().today) {
  return getAvailableTaskDefinitionsForUserFromDb(prisma, userId, date);
}

export async function ensureProfile(userId: string) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return withDerivedProfileLevel(profile);
}

async function ensureLogForDate(db: TaskAccessClient, userId: string, date = getShanghaiDateParts().today) {
  const existing = await db.dailyLog.findUnique({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
  });

  if (existing) {
    return existing;
  }

  const availableTasks = await getAvailableTaskDefinitionsForUserFromDb(db, userId, date);

  return db.dailyLog.create({
    data: {
      userId,
      date,
      tasksJson: serializeTaskSnapshots(availableTasks.map((task) => mapTaskDefinitionToDailyTaskSnapshot(task))),
    },
  });
}

export async function ensureTodayLog(userId: string, date = getShanghaiDateParts().today) {
  return ensureLogForDate(prisma, userId, date);
}

async function rebuildCompletedTaskSlugsProfile(
  db: Pick<typeof prisma, "dailyLog" | "profile" | "dailyTaskCompletion">,
  profile: Profile,
  userId: string,
  dateKey: string,
) {
  const [logs, todayCompletions] = await Promise.all([
    db.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: addDaysToDateKey(dateKey, -90),
          lt: dateKey,
        },
        settledAt: {
          not: null,
        },
      },
      select: {
        completedTaskIds: true,
        tasksJson: true,
      },
      orderBy: { date: "desc" },
      take: 90,
    }),
    db.dailyTaskCompletion.findMany({
      where: {
        userId,
        dateKey,
        status: "COMPLETED",
      },
      select: {
        taskSlug: true,
      },
    }),
  ]);

  const completedTaskSlugs = toSortedUniqueSlugs([
    ...logs.flatMap((log) => getCompletedTaskSlugsFromLog(log)),
    ...todayCompletions.map((completion) => completion.taskSlug),
  ]);

  return db.profile.update({
    where: { id: profile.id },
    data: {
      completedTaskSlugsJson: JSON.stringify(completedTaskSlugs),
      completedTaskSlugsBackfilledAt: new Date(),
    },
  });
}

async function syncTodayLogSnapshot(
  db: Pick<typeof prisma, "dailyLog">,
  log: DailyLog,
  completedTaskSlugs: string[],
  streakAfter: number,
  completedAt: Date | null,
) {
  const rewards = calculateRewards(completedTaskSlugs, parseTasksJson(log.tasksJson));

  return db.dailyLog.update({
    where: { id: log.id },
    data: {
      completedTaskIds: JSON.stringify(completedTaskSlugs),
      earnedExp: rewards.exp,
      earnedPoints: rewards.points,
      streakAfter,
      settledAt: completedTaskSlugs.length > 0 ? completedAt ?? new Date() : null,
    },
  });
}

async function getLatestSettledLogBeforeDate(
  db: Pick<typeof prisma, "dailyLog">,
  userId: string,
  dateKey: string,
) {
  return db.dailyLog.findFirst({
    where: {
      userId,
      date: {
        lt: dateKey,
      },
      settledAt: {
        not: null,
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

async function applyTaskRewardBalanceChange(
  db: Pick<typeof prisma, "profile" | "userPet">,
  params: {
    profile: Profile;
    userId: string;
    userXpDelta: number;
    pointsDelta: number;
    petXpDelta: number;
    userPetId?: string | null;
    nextStreak?: number;
    nextLastCompletedDate?: string | null;
    nextLastSettledDate?: string | null;
  },
) {
  const nextExp = params.profile.exp + params.userXpDelta;
  const nextPoints = params.profile.points + params.pointsDelta;

  const profile = await db.profile.update({
    where: { id: params.profile.id },
    data: {
      exp: nextExp,
      points: nextPoints,
      level: getDisplayLevel(nextExp, params.profile.level),
      ...(typeof params.nextStreak === "number" ? { streak: params.nextStreak } : {}),
      ...(params.nextLastCompletedDate !== undefined ? { lastCompletedDate: params.nextLastCompletedDate } : {}),
      ...(params.nextLastSettledDate !== undefined ? { lastSettledDate: params.nextLastSettledDate } : {}),
    },
  });

  if (params.petXpDelta !== 0 && params.userPetId) {
    const pet = await db.userPet.findUnique({
      where: { id: params.userPetId },
    });

    if (pet) {
      await db.userPet.update({
        where: { id: pet.id },
        data: {
          xp: Math.max(0, pet.xp + params.petXpDelta),
        },
      });
    }
  }

  return withDerivedProfileLevel(profile);
}

async function createTaskRewardLedgers(
  db: Pick<typeof prisma, "pointsLedger" | "xpLedger">,
  params: {
    userId: string;
    userPetId?: string | null;
    dateKey: string;
    taskSlug: string;
    taskNameZh: string;
    completionId: string;
    ledgerGroupId: string;
    pointsDelta: number;
    userXpDelta: number;
    petXpDelta: number;
    direction: "complete" | "revert";
  },
) {
  const sign = params.direction === "complete" ? 1 : -1;
  const meta = JSON.stringify({
    dateKey: params.dateKey,
    taskSlug: params.taskSlug,
    taskNameZh: params.taskNameZh,
    completionId: params.completionId,
    ledgerGroupId: params.ledgerGroupId,
  });

  if (params.pointsDelta !== 0) {
    await db.pointsLedger.create({
      data: {
        userId: params.userId,
        delta: params.pointsDelta * sign,
        reason: params.direction === "complete" ? "daily_task_complete" : "daily_task_revert",
        description:
          params.direction === "complete"
            ? formatText(zhCN.ledger.dailyTaskComplete, { task: params.taskNameZh, date: params.dateKey })
            : formatText(zhCN.ledger.dailyTaskRevert, { task: params.taskNameZh, date: params.dateKey }),
        metaJson: meta,
      },
    });
  }

  if (params.userXpDelta !== 0) {
    await db.xpLedger.create({
      data: {
        userId: params.userId,
        scope: XpLedgerScope.USER,
        delta: params.userXpDelta * sign,
        reason: params.direction === "complete" ? "daily_task_complete" : "daily_task_revert",
        description:
          params.direction === "complete"
            ? formatText(zhCN.ledger.dailyTaskUserXpComplete, { task: params.taskNameZh, date: params.dateKey })
            : formatText(zhCN.ledger.dailyTaskUserXpRevert, { task: params.taskNameZh, date: params.dateKey }),
        metaJson: meta,
      },
    });
  }

  if (params.petXpDelta !== 0 && params.userPetId) {
    await db.xpLedger.create({
      data: {
        userId: params.userId,
        userPetId: params.userPetId,
        scope: XpLedgerScope.PET,
        delta: params.petXpDelta * sign,
        reason: params.direction === "complete" ? "daily_task_complete" : "daily_task_revert",
        description:
          params.direction === "complete"
            ? formatText(zhCN.ledger.dailyTaskPetXpComplete, { task: params.taskNameZh, date: params.dateKey })
            : formatText(zhCN.ledger.dailyTaskPetXpRevert, { task: params.taskNameZh, date: params.dateKey }),
        metaJson: meta,
      },
    });
  }
}

export async function resetStreakIfNeeded(profile: Profile) {
  const { today } = getShanghaiDateParts();

  if (!shouldResetStreakForMissedDay(profile, today)) {
    return withDerivedProfileLevel(profile);
  }

  const updatedProfile = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      streak: 0,
    },
  });

  return withDerivedProfileLevel(updatedProfile);
}

export async function getDashboardState(userId: string) {
  const { today } = getShanghaiDateParts();
  const log = await ensureTodayLog(userId);
  const [user, recentLogs, recentLedger, recentPurchases, recentRedeemCodes, todayCompletions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 14,
    }),
    prisma.pointsLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.userPurchase.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.redeemCode.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { issuedAt: "desc" },
      take: 20,
    }),
    prisma.dailyTaskCompletion.findMany({
      where: {
        userId,
        dateKey: today,
      },
      select: {
        taskSlug: true,
        status: true,
        completedAt: true,
      },
    }),
  ]);

  const streakBroken = user.profile ? shouldResetStreakForMissedDay(user.profile, today) : false;
  const profile = user.profile ? await resetStreakIfNeeded(user.profile) : await ensureProfile(userId);
  const taskAvailability = await getTaskAvailabilityForUserFromDb(prisma, userId);
  const currentProfile = {
    ...withDerivedProfileLevel(profile),
    completedTaskSlugsJson: taskAvailability.profile.completedTaskSlugsJson,
  };
  const shopItems = await getActiveShopItemsWithUserState(userId);
  const makeupCardItem = shopItems.find((item) => item.kind === "MAKEUP_CARD");
  const todayTasks = buildTodayTasks(log, todayCompletions);
  const todayCompletedTaskIds = todayTasks.filter((task) => task.completed).map((task) => task.id);

  return {
    user: {
      ...user,
      profile: currentProfile,
    },
    todayLog: log,
    recentLogs,
    recentLedger,
    recentPurchases,
    recentRedeemCodes,
    todayCompletedTaskIds,
    tasks: todayTasks,
    lockedTasks: taskAvailability.locked.filter((task) => !todayTasks.some((todayTask) => todayTask.slug === task.slug)),
    nextShopPrice: makeupCardItem?.currentPrice ?? getNextMakeupCardPrice(currentProfile.purchaseCount),
    shopItems,
    makeupPromptVisible: streakBroken && currentProfile.makeupCards > 0,
  };
}

export async function getPetPageState(userId: string) {
  const pets = await getOwnedPetsWithStages(prisma, userId);

  return {
    pets,
    activePet: pets.find((pet) => pet.isActive) ?? pets[0] ?? null,
  };
}

export async function getBackpackState(userId: string) {
  const [profile, ownedPets, ownedSkins, redeemCodes] = await Promise.all([
    ensureProfile(userId),
    getOwnedPetsWithStages(prisma, userId),
    prisma.userPetSkin.findMany({
      where: {
        userId,
        skin: {
          isActive: true,
        },
      },
      include: USER_PET_SKIN_INCLUDE,
      orderBy: [{ obtainedAt: "asc" }],
    }),
    prisma.redeemCode.findMany({
      where: { userId },
      include: {
        item: true,
      },
      orderBy: [{ issuedAt: "desc" }],
      take: 50,
    }),
  ]);

  return {
    profile: {
      points: profile.points,
      makeupCards: profile.makeupCards,
    },
    ownedPets,
    ownedSkins: ownedSkins.map((record) => toOwnedSkinView(record as UserPetSkinRecord)),
    redeemCodes,
  };
}

export async function getPokedexState(userId: string) {
  const [species, pets] = await Promise.all([getAllPetSpecies(prisma), getOwnedPetsWithStages(prisma, userId)]);
  const petBySpeciesId = new Map(
    pets.map((pet) => [
      pet.speciesId,
      {
        xp: pet.xp,
        currentStageId: pet.currentStage.id,
        currentImageKey: pet.currentImageKey,
        currentStageCoverImageUrl: pet.currentStageCoverImageUrl,
      },
    ]),
  );

  return {
    species: species.map((entry) => ({
      ...entry,
      ownedPet: petBySpeciesId.get(entry.id) ?? null,
      owned: petBySpeciesId.has(entry.id),
      previewCoverImageUrl: petBySpeciesId.get(entry.id)?.currentStageCoverImageUrl ?? entry.coverImageUrl ?? PET_STAGE_PLACEHOLDER_IMAGE,
    })),
    ownedPets: pets,
  };
}

export async function getPokedexSpeciesState(userId: string, slug: string) {
  const [species, pet] = await Promise.all([
    prisma.petSpecies.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: PET_SPECIES_INCLUDE,
    }),
    prisma.userPet.findFirst({
      where: {
        userId,
        species: {
          slug,
          isActive: true,
        },
      },
      include: USER_PET_INCLUDE,
    }),
  ]);

  if (!species) {
    return null;
  }

  const normalizedSpecies = {
    ...withResolvedStageAssets(species),
  };
  const ownedPet = pet ? toOwnedPetView(pet as UserPetRecord) : null;

  return {
    species: normalizedSpecies,
    owned: ownedPet != null,
    ownedPet,
    previewCoverImageUrl: ownedPet
      ? ownedPet.currentStageCoverImageUrl
      : normalizedSpecies.coverImageUrl ?? PET_STAGE_PLACEHOLDER_IMAGE,
  };
}

export async function getPetEggShopState(userId: string) {
  const [profile, item, species, pets] = await Promise.all([
    ensureProfile(userId),
    prisma.shopItem.findFirst({
      where: {
        slug: "pet-egg",
        kind: "PET_EGG",
        isActive: true,
      },
    }),
    getAllPetSpecies(prisma),
    getOwnedPetsWithStages(prisma, userId),
  ]);

  const ownedSpeciesIds = new Set(pets.map((pet) => pet.speciesId));
  const availableSpecies = species.filter((entry) => !ownedSpeciesIds.has(entry.id));

  const purchaseCount =
    item == null
      ? 0
      : await prisma.userPurchase.aggregate({
          where: {
            userId,
            itemId: item.id,
          },
          _sum: {
            quantity: true,
          },
        }).then((result) => result._sum.quantity ?? 0);

  return {
    profile,
    item: item
      ? {
          ...item,
          currentPrice: getShopItemPrice(item.priceBase, item.priceStep, purchaseCount),
        }
      : null,
    availableSpecies,
    ownedPets: pets,
  };
}

export async function updateTodayTaskSelection(userId: string, taskIds: string[]) {
  const { today } = getShanghaiDateParts();
  const log = await ensureTodayLog(userId, today);

  if (log.settledAt) {
    throw new Error(zhCN.actions.alreadySettledToday);
  }

  const normalized = normalizeTaskSelection(taskIds, parseTasksJson(log.tasksJson));

  return prisma.dailyLog.update({
    where: { id: log.id },
    data: {
      completedTaskIds: JSON.stringify(normalized),
    },
  });
}

async function completeDailyTaskForUser(
  userId: string,
  taskSlug: string,
  options?: {
    completedBy?: string;
  },
) {
  const { today } = getShanghaiDateParts();

  return prisma.$transaction(async (tx) => {
    let profile = await tx.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    if (shouldResetStreakForMissedDay(profile, today)) {
      profile = await tx.profile.update({
        where: { id: profile.id },
        data: { streak: 0 },
      });
    }

    const [log, activePet, completionRecords] = await Promise.all([
      ensureLogForDate(tx, userId, today),
      tx.userPet.findFirst({
        where: {
          userId,
          isActive: true,
        },
      }),
      tx.dailyTaskCompletion.findMany({
        where: {
          userId,
          dateKey: today,
        },
        select: {
          taskSlug: true,
          status: true,
          completedAt: true,
        },
      }),
    ]);

    const task = getTaskRewardBySlug(log, taskSlug);

    if (!task) {
      throw new Error(zhCN.actions.taskNotFound);
    }

    const existingCompletion = await tx.dailyTaskCompletion.findUnique({
      where: {
        userId_dateKey_taskSlug: {
          userId,
          dateKey: today,
          taskSlug,
        },
      },
    });

    if (existingCompletion?.status === "COMPLETED") {
      return {
        status: "noop" as const,
      };
    }

    const hadCompletedTaskBefore = completionRecords.some((completion) => completion.status === "COMPLETED");
    const completedAt = new Date();
    const ledgerGroupId = randomUUID();
    const completion =
      existingCompletion == null
        ? await tx.dailyTaskCompletion.create({
            data: {
              userId,
              dateKey: today,
              taskSlug,
              userPetId: activePet?.id ?? null,
              status: DailyTaskCompletionStatus.COMPLETED,
              completedAt,
              revertedAt: null,
              revertedBy: null,
              pointsDelta: task.points,
              userXpDelta: task.exp,
              petXpDelta: activePet ? task.exp : 0,
              ledgerGroupId,
            },
          })
        : await tx.dailyTaskCompletion.update({
            where: { id: existingCompletion.id },
            data: {
              userPetId: activePet?.id ?? null,
              status: DailyTaskCompletionStatus.COMPLETED,
              completedAt,
              revertedAt: null,
              revertedBy: null,
              pointsDelta: task.points,
              userXpDelta: task.exp,
              petXpDelta: activePet ? task.exp : 0,
              ledgerGroupId,
            },
          });

    profile = await applyTaskRewardBalanceChange(tx, {
      profile,
      userId,
      userXpDelta: task.exp,
      pointsDelta: task.points,
      petXpDelta: activePet ? task.exp : 0,
      userPetId: activePet?.id,
      ...(hadCompletedTaskBefore
        ? {}
        : {
            nextStreak: calculateNextStreak(profile, today, true),
            nextLastCompletedDate: today,
            nextLastSettledDate: today,
          }),
    });

    await createTaskRewardLedgers(tx, {
      userId,
      userPetId: activePet?.id,
      dateKey: today,
      taskSlug,
      taskNameZh: task.nameZh,
      completionId: completion.id,
      ledgerGroupId,
      pointsDelta: task.points,
      userXpDelta: task.exp,
      petXpDelta: activePet ? task.exp : 0,
      direction: "complete",
    });

    profile = await addCompletedTaskSlugsToProfile(tx, profile, [task.slug]);

    const completedTaskSlugs = toSortedUniqueSlugs(
      getCompletedTaskSlugsFromTaskRecords(parseTasksJson(log.tasksJson), [
        ...completionRecords,
        {
          taskSlug,
          status: DailyTaskCompletionStatus.COMPLETED,
          completedAt,
        },
      ]),
    );

    const streakAfter = completedTaskSlugs.length > 0 ? profile.streak : 0;
    const updatedLog = await syncTodayLogSnapshot(tx, log, completedTaskSlugs, streakAfter, completedAt);

    return {
      status: "completed" as const,
      profile,
      log: updatedLog,
    };
  });
}

async function revertDailyTaskForUser(
  userId: string,
  taskSlug: string,
  revertedBy?: string,
) {
  const { today } = getShanghaiDateParts();

  return prisma.$transaction(async (tx) => {
    let profile = await tx.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const log = await ensureLogForDate(tx, userId, today);
    const completion = await tx.dailyTaskCompletion.findUnique({
      where: {
        userId_dateKey_taskSlug: {
          userId,
          dateKey: today,
          taskSlug,
        },
      },
    });

    if (!completion || completion.status !== "COMPLETED") {
      return {
        status: "noop" as const,
      };
    }

    const task = getTaskRewardBySlug(log, taskSlug);

    if (!task) {
      throw new Error(zhCN.actions.taskNotFound);
    }

    const revertedAt = new Date();
    await tx.dailyTaskCompletion.update({
      where: { id: completion.id },
      data: {
        status: DailyTaskCompletionStatus.PENDING,
        revertedAt,
        revertedBy: revertedBy ?? null,
      },
    });

    profile = await applyTaskRewardBalanceChange(tx, {
      profile,
      userId,
      userXpDelta: -completion.userXpDelta,
      pointsDelta: -completion.pointsDelta,
      petXpDelta: -completion.petXpDelta,
      userPetId: completion.userPetId,
    });

    await createTaskRewardLedgers(tx, {
      userId,
      userPetId: completion.userPetId,
      dateKey: today,
      taskSlug,
      taskNameZh: task.nameZh,
      completionId: completion.id,
      ledgerGroupId: completion.ledgerGroupId ?? completion.id,
      pointsDelta: completion.pointsDelta,
      userXpDelta: completion.userXpDelta,
      petXpDelta: completion.petXpDelta,
      direction: "revert",
    });

    const remainingCompletions = await tx.dailyTaskCompletion.findMany({
      where: {
        userId,
        dateKey: today,
        status: DailyTaskCompletionStatus.COMPLETED,
      },
      select: {
        taskSlug: true,
        status: true,
        completedAt: true,
      },
    });

    const completedTaskSlugs = getCompletedTaskSlugsFromTaskRecords(parseTasksJson(log.tasksJson), remainingCompletions);

    if (remainingCompletions.length === 0) {
      const latestSettledLog = await getLatestSettledLogBeforeDate(tx, userId, today);
      const yesterdayDate = addDaysToDateKey(today, -1);
      profile = await tx.profile.update({
        where: { id: profile.id },
        data: {
          streak: latestSettledLog?.date === yesterdayDate ? latestSettledLog.streakAfter : 0,
          lastCompletedDate: latestSettledLog?.date ?? null,
          lastSettledDate: latestSettledLog?.date ?? null,
        },
      });
      profile = withDerivedProfileLevel(profile);
    }

    profile = await rebuildCompletedTaskSlugsProfile(tx, profile, userId, today);

    const streakAfter = remainingCompletions.length === 0 ? 0 : profile.streak;
    const updatedLog = await syncTodayLogSnapshot(
      tx,
      log,
      completedTaskSlugs,
      streakAfter,
      remainingCompletions[0]?.completedAt ?? null,
    );

    return {
      status: "reverted" as const,
      profile,
      log: updatedLog,
    };
  });
}

export async function completeDailyTask(userId: string, taskSlug: string) {
  return completeDailyTaskForUser(userId, taskSlug);
}

async function resolveUserIdFromQuery(userQuery: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: userQuery }, { username: userQuery }],
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error(zhCN.actions.userNotFound);
  }

  return user.id;
}

export async function adminCompleteDailyTask(userQuery: string, taskSlug: string, adminId = "admin") {
  const userId = await resolveUserIdFromQuery(userQuery);
  return completeDailyTaskForUser(userId, taskSlug, {
    completedBy: adminId,
  });
}

export async function adminRevertDailyTask(userQuery: string, taskSlug: string, adminId = "admin") {
  const userId = await resolveUserIdFromQuery(userQuery);
  return revertDailyTaskForUser(userId, taskSlug, adminId);
}

export async function adminSyncTodayTasks(userQuery: string) {
  const userId = await resolveUserIdFromQuery(userQuery);
  const { today } = getShanghaiDateParts();

  return prisma.$transaction(async (tx) => {
    const log = await ensureLogForDate(tx, userId, today);
    const unlockedTasks = await getAvailableTaskDefinitionsForUserFromDb(tx, userId, today);
    const existingSnapshots = parseTasksJson(log.tasksJson);
    const snapshotBySlug = new Map(existingSnapshots.map((task) => [task.slug, task]));

    let addedCount = 0;

    for (const task of unlockedTasks) {
      if (!snapshotBySlug.has(task.slug)) {
        addedCount += 1;
      }

      snapshotBySlug.set(task.slug, {
        ...(snapshotBySlug.get(task.slug) ?? mapTaskDefinitionToDailyTaskSnapshot(task)),
        id: task.slug,
        slug: task.slug,
        nameZh: task.nameZh,
        descriptionZh: task.descriptionZh,
        exp: task.exp,
        points: task.points,
      });
    }

    const mergedSnapshots = Array.from(snapshotBySlug.values());

    await tx.dailyLog.update({
      where: { id: log.id },
      data: {
        tasksJson: serializeTaskSnapshots(mergedSnapshots),
      },
    });

    return {
      userId,
      dateKey: today,
      addedCount,
      totalCount: mergedSnapshots.length,
    };
  });
}

export async function setActivePet(userId: string, userPetId: string) {
  return prisma.$transaction(async (tx) => {
    const pet = await tx.userPet.findUnique({
      where: { id: userPetId },
    });

    if (!pet || pet.userId !== userId) {
      throw new Error(zhCN.actions.petNotOwned);
    }

    await tx.userPet.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return tx.userPet.update({
      where: { id: userPetId },
      data: { isActive: true },
      include: USER_PET_INCLUDE,
    });
  });
}

export async function updatePetNickname(userId: string, userPetId: string, nickname?: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.userPet.updateMany({
      where: {
        id: userPetId,
        userId,
        nicknameUpdatedAt: null,
      },
      data: {
        nickname: nickname || null,
        nicknameUpdatedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const pet = await tx.userPet.findFirst({
        where: {
          id: userPetId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!pet) {
        throw new Error(zhCN.actions.petNotOwned);
      }

      throw new Error(zhCN.actions.petNicknameLocked);
    }

    return tx.userPet.findUniqueOrThrow({
      where: { id: userPetId },
      include: USER_PET_INCLUDE,
    });
  });
}

export async function applyPetSkin(userId: string, userPetId: string, skinId?: string) {
  return prisma.$transaction(async (tx) => {
    const pet = await tx.userPet.findUnique({
      where: { id: userPetId },
      include: USER_PET_INCLUDE,
    });

    if (!pet || pet.userId !== userId) {
      throw new Error(zhCN.actions.petNotOwned);
    }

    if (!skinId) {
      return tx.userPet.update({
        where: { id: userPetId },
        data: { activeSkinId: null },
        include: USER_PET_INCLUDE,
      });
    }

    const ownedSkin = await tx.userPetSkin.findUnique({
      where: {
        userId_skinId: {
          userId,
          skinId,
        },
      },
      include: USER_PET_SKIN_INCLUDE,
    });

    if (!ownedSkin || !ownedSkin.skin.isActive) {
      throw new Error(zhCN.actions.petSkinNotOwned);
    }

    if (!isSkinUsableForPet(ownedSkin.skin, pet as UserPetRecord)) {
      throw new Error(zhCN.actions.petSkinMismatch);
    }

    return tx.userPet.update({
      where: { id: userPetId },
      data: { activeSkinId: ownedSkin.skin.id },
      include: USER_PET_INCLUDE,
    });
  });
}

export async function settleToday(userId: string) {
  const { today } = getShanghaiDateParts();

  return prisma.$transaction(async (tx) => {
    const [profile, log] = await Promise.all([
      tx.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      ensureLogForDate(tx, userId, today),
    ]);

    return {
      profile: withDerivedProfileLevel(profile),
      log,
    };
  });
}

export async function purchaseShopItem(userId: string, itemId: string) {
  return prisma.$transaction(async (tx) => {
    const [profile, item] = await Promise.all([
      tx.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      tx.shopItem.findUnique({
        where: { id: itemId },
        include: {
          petSkin: true,
        },
      }),
    ]);

    if (!item) {
      throw new Error(zhCN.actions.itemNotFound);
    }

    if (!item.isActive) {
      throw new Error(zhCN.actions.itemInactive);
    }

    if (item.kind === "PET_EGG") {
      throw new Error(zhCN.actions.petEggItemInvalid);
    }

    if (item.kind === "PET_SKIN" && !item.petSkin) {
      throw new Error(zhCN.actions.itemNotFound);
    }

    if (item.kind === "PET_SKIN" && item.petSkin) {
      if (!item.petSkin.speciesId) {
        throw new Error(zhCN.actions.itemNotFound);
      }

      const ownedSpecies = await tx.userPet.findFirst({
        where: {
          userId,
          speciesId: item.petSkin.speciesId,
        },
        select: {
          id: true,
        },
      });

      if (!ownedSpecies) {
        throw new Error(zhCN.actions.petSkinSpeciesRequired);
      }

      const ownedSkin = await tx.userPetSkin.findUnique({
        where: {
          userId_skinId: {
            userId,
            skinId: item.petSkin.id,
          },
        },
      });

      if (ownedSkin) {
        throw new Error(zhCN.actions.petSkinOwned);
      }
    }

    const aggregate = await tx.userPurchase.aggregate({
      where: {
        userId,
        itemId,
      },
      _sum: {
        quantity: true,
      },
    });
    const purchaseCount = aggregate._sum.quantity ?? 0;
    const cost = getShopItemPrice(item.priceBase, item.priceStep, purchaseCount);

    if (profile.points < cost) {
      throw new Error(item.kind === "MAKEUP_CARD" ? zhCN.actions.pointsNotEnough : zhCN.actions.pointsNotEnoughItem);
    }

    const updatedProfile = await tx.profile.update({
      where: { id: profile.id },
      data: {
        points: profile.points - cost,
        makeupCards: item.kind === "MAKEUP_CARD" ? profile.makeupCards + 1 : profile.makeupCards,
        purchaseCount: item.kind === "MAKEUP_CARD" ? purchaseCount + 1 : profile.purchaseCount,
      },
    });

    const purchase = await tx.userPurchase.create({
      data: {
        userId,
        itemId,
        quantity: 1,
        totalCost: cost,
      },
      include: {
        item: true,
      },
    });

    const ledgerReason =
      item.kind === "MAKEUP_CARD" ? "shop_makeup_card" : item.kind === "PET_SKIN" ? "shop_pet_skin" : "shop_coupon";
    await tx.pointsLedger.create({
      data: {
        userId,
        delta: -cost,
        reason: ledgerReason,
        description:
          item.kind === "MAKEUP_CARD"
            ? zhCN.ledger.purchasedMakeupCard
            : formatText(zhCN.ledger.purchasedItem, { name: item.nameZh }),
        metaJson: JSON.stringify({
          itemId: item.id,
          itemSlug: item.slug,
          cost,
        }),
      },
    });

    const redeemCode =
      item.kind === "COUPON"
        ? await tx.redeemCode.create({
            data: {
              userId,
              itemId,
              status: "ISSUED",
            },
          })
        : null;

    const grantedSkin =
      item.kind === "PET_SKIN" && item.petSkin
        ? await tx.userPetSkin.create({
            data: {
              userId,
              skinId: item.petSkin.id,
            },
            include: USER_PET_SKIN_INCLUDE,
          })
        : null;

    return {
      profile: updatedProfile,
      purchase,
      redeemCode,
      grantedSkin: grantedSkin ? toOwnedSkinView(grantedSkin as UserPetSkinRecord) : null,
    };
  });
}

export async function purchasePetEgg(userId: string, itemId: string, speciesId: string) {
  return prisma.$transaction(async (tx) => {
    const [profile, item, species, existingPet, activePet] = await Promise.all([
      tx.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      tx.shopItem.findUnique({
        where: { id: itemId },
      }),
      tx.petSpecies.findFirst({
        where: {
          id: speciesId,
          isActive: true,
        },
      }),
      tx.userPet.findUnique({
        where: {
          userId_speciesId: {
            userId,
            speciesId,
          },
        },
      }),
      tx.userPet.findFirst({
        where: {
          userId,
          isActive: true,
        },
      }),
    ]);

    if (!item) {
      throw new Error(zhCN.actions.itemNotFound);
    }

    if (!item.isActive) {
      throw new Error(zhCN.actions.itemInactive);
    }

    if (item.kind !== "PET_EGG") {
      throw new Error(zhCN.actions.petEggItemInvalid);
    }

    if (!species) {
      throw new Error(zhCN.actions.petSpeciesNotFound);
    }

    if (existingPet) {
      throw new Error(zhCN.actions.petAlreadyOwned);
    }

    const aggregate = await tx.userPurchase.aggregate({
      where: {
        userId,
        itemId,
      },
      _sum: {
        quantity: true,
      },
    });
    const purchaseCount = aggregate._sum.quantity ?? 0;
    const cost = getShopItemPrice(item.priceBase, item.priceStep, purchaseCount);

    if (profile.points < cost) {
      throw new Error(zhCN.actions.pointsNotEnoughItem);
    }

    const updatedProfile = await tx.profile.update({
      where: { id: profile.id },
      data: {
        points: profile.points - cost,
      },
    });

    const purchase = await tx.userPurchase.create({
      data: {
        userId,
        itemId,
        quantity: 1,
        totalCost: cost,
      },
      include: {
        item: true,
      },
    });

    await tx.pointsLedger.create({
      data: {
        userId,
        delta: -cost,
        reason: "shop_pet_egg",
        description: formatText(zhCN.ledger.purchasedItem, { name: item.nameZh }),
        metaJson: JSON.stringify({
          itemId: item.id,
          itemSlug: item.slug,
          speciesId: species.id,
          speciesSlug: species.slug,
          cost,
        }),
      },
    });

    const userPet = await tx.userPet.create({
      data: {
        userId,
        speciesId,
        isActive: activePet ? false : true,
      },
      include: USER_PET_INCLUDE,
    });

    return {
      profile: updatedProfile,
      purchase,
      userPet: toOwnedPetView(userPet as UserPetRecord),
    };
  });
}

export async function purchaseMakeupCard(userId: string) {
  const item = await prisma.shopItem.findFirst({
    where: {
      kind: "MAKEUP_CARD",
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!item) {
    throw new Error(zhCN.actions.itemNotFound);
  }

  return purchaseShopItem(userId, item.id);
}

export async function useYesterdayMakeupCard(userId: string) {
  const { today, yesterday } = getShanghaiDateParts();
  const dayBeforeYesterday = addDaysToDateKey(yesterday, -1);

  return prisma.$transaction(async (tx) => {
    let profile = await tx.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    if (profile.makeupCards < 1) {
      throw new Error(zhCN.actions.noMakeupCards);
    }

    const yesterdayLog = await tx.dailyLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterday,
        },
      },
    });

    if (!yesterdayLog) {
      throw new Error(zhCN.actions.noYesterdayLog);
    }

    if (yesterdayLog.settledAt) {
      throw new Error(zhCN.actions.yesterdayAlreadySettled);
    }

    const todayCompletion = await tx.dailyTaskCompletion.findFirst({
      where: {
        userId,
        dateKey: today,
        status: DailyTaskCompletionStatus.COMPLETED,
      },
      select: {
        id: true,
      },
    });

    if (todayCompletion) {
      throw new Error(zhCN.actions.useBeforeSettlingToday);
    }

    const completedTaskIds = parseCompletedTaskIds(yesterdayLog);

    if (completedTaskIds.length === 0) {
      throw new Error(zhCN.actions.noCompletedTasksYesterday);
    }

    const previousSettledLog = await tx.dailyLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: dayBeforeYesterday,
        },
      },
    });

    const rewards = calculateRewards(completedTaskIds, parseTasksJson(yesterdayLog.tasksJson));
    const restoredStreak = (previousSettledLog?.streakAfter ?? 0) + 1;
    const nextExp = profile.exp + rewards.exp;
    const nextPoints = profile.points + rewards.points;

    const updatedLog = await tx.dailyLog.update({
      where: { id: yesterdayLog.id },
      data: {
        settledAt: new Date(),
        earnedExp: rewards.exp,
        earnedPoints: rewards.points,
        streakAfter: restoredStreak,
      },
    });

    profile = await tx.profile.update({
      where: { id: profile.id },
      data: {
        exp: nextExp,
        points: nextPoints,
        level: getDisplayLevel(nextExp, profile.level),
        streak: restoredStreak,
        makeupCards: profile.makeupCards - 1,
        lastCompletedDate: yesterday,
        lastSettledDate: yesterday,
      },
    });
    profile = withDerivedProfileLevel(profile);

    profile = await addCompletedTaskSlugsToProfile(tx, profile, getCompletedTaskSlugsFromLog(yesterdayLog));
    profile = withDerivedProfileLevel(profile);

    await grantPetXpToActivePet(tx, userId, rewards.exp);

    await tx.pointsLedger.createMany({
      data: [
        {
          userId,
          delta: rewards.points,
          reason: "makeup_settlement",
          description: formatText(zhCN.ledger.makeupSettlement, { date: yesterday }),
          metaJson: JSON.stringify({
            date: yesterday,
            completedTaskIds,
            exp: rewards.exp,
          }),
        },
        {
          userId,
          delta: 0,
          reason: "makeup_card_used",
          description: formatText(zhCN.ledger.usedMakeupCard, { date: yesterday }),
          metaJson: JSON.stringify({ date: yesterday }),
        },
      ],
    });

    return {
      profile,
      log: updatedLog,
    };
  });
}

export async function getAdminState(status?: RedeemCodeStatus, code?: string) {
  const [items, tasks, redeemCodes] = await Promise.all([
    prisma.shopItem.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    }),
    prisma.taskDefinition.findMany({
      orderBy: [{ isActive: "desc" }, { unlockLevel: "asc" }, { createdAt: "asc" }],
    }),
    prisma.redeemCode.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(code ? { id: code } : {}),
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        item: true,
      },
      orderBy: { issuedAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    items,
    tasks,
    redeemCodes,
  };
}

export async function getAdminOverview() {
  const [itemsCount, activeItemsCount, tasksCount, activeTasksCount, petsCount, activePetsCount, issuedCodesCount] = await Promise.all([
    prisma.shopItem.count(),
    prisma.shopItem.count({ where: { isActive: true } }),
    prisma.taskDefinition.count(),
    prisma.taskDefinition.count({ where: { isActive: true } }),
    prisma.petSpecies.count(),
    prisma.petSpecies.count({ where: { isActive: true } }),
    prisma.redeemCode.count({ where: { status: "ISSUED" } }),
  ]);

  return {
    itemsCount,
    activeItemsCount,
    tasksCount,
    activeTasksCount,
    petsCount,
    activePetsCount,
    issuedCodesCount,
  };
}

export async function getAdminTodayAuditState(userQuery?: string) {
  const { today } = getShanghaiDateParts();
  const query = userQuery?.trim() ?? "";

  if (!query) {
    return {
      dateKey: today,
      targetUser: null,
      tasks: [] as TodayTaskView[],
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: query }, { username: query }],
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    return {
      dateKey: today,
      targetUser: null,
      tasks: [] as TodayTaskView[],
    };
  }

  const log = await ensureLogForDate(prisma, user.id, today);
  const completions = await prisma.dailyTaskCompletion.findMany({
    where: {
      userId: user.id,
      dateKey: today,
    },
    select: {
      taskSlug: true,
      status: true,
      completedAt: true,
    },
  });

  return {
    dateKey: today,
    targetUser: {
      id: user.id,
      username: user.username,
      profile: user.profile ? withDerivedProfileLevel(user.profile) : null,
    },
    tasks: buildTodayTasks(log, completions),
  };
}

export async function getAdminItems() {
  return prisma.shopItem.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
}

export async function getAdminTasks() {
  return prisma.taskDefinition.findMany({
    orderBy: [{ isActive: "desc" }, { unlockLevel: "asc" }, { createdAt: "asc" }],
  });
}

export async function listPets() {
  return prisma.petSpecies.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getAdminPets() {
  return listPets();
}

export async function getAdminPetById(id: string) {
  return prisma.petSpecies.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: { stageIndex: "asc" },
      },
    },
  });
}

export async function getAdminRedeemCodes(status?: RedeemCodeStatus, code?: string) {
  return prisma.redeemCode.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(code ? { id: code } : {}),
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      item: true,
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });
}

export async function saveTaskDefinition(input: {
  id?: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  exp: number;
  points: number;
  unlockLevel: number;
  unlockAfterTaskSlug?: string;
  isActive?: boolean;
}) {
  const existingBySlug = await prisma.taskDefinition.findUnique({
    where: { slug: input.slug },
  });

  if (existingBySlug && existingBySlug.id !== input.id) {
    throw new Error(zhCN.actions.taskSlugTaken);
  }

  if (input.unlockAfterTaskSlug === input.slug) {
    throw new Error(zhCN.actions.taskPrerequisiteSelf);
  }

  if (input.unlockAfterTaskSlug) {
    const prerequisite = await prisma.taskDefinition.findUnique({
      where: { slug: input.unlockAfterTaskSlug },
      select: { id: true },
    });

    if (!prerequisite) {
      throw new Error(zhCN.actions.taskPrerequisiteMissing);
    }
  }

  if (input.id) {
    const task = await prisma.taskDefinition.findUnique({
      where: { id: input.id },
    });

    if (!task) {
      throw new Error(zhCN.actions.taskNotFound);
    }

    return prisma.taskDefinition.update({
      where: { id: input.id },
      data: {
        slug: input.slug,
        nameZh: input.nameZh,
        descriptionZh: input.descriptionZh,
        exp: input.exp,
        points: input.points,
        unlockLevel: input.unlockLevel,
        unlockAfterTaskSlug: input.unlockAfterTaskSlug,
        isActive: input.isActive ?? task.isActive,
      },
    });
  }

  return prisma.taskDefinition.create({
    data: {
      slug: input.slug,
      nameZh: input.nameZh,
      descriptionZh: input.descriptionZh,
      exp: input.exp,
      points: input.points,
      unlockLevel: input.unlockLevel,
      unlockAfterTaskSlug: input.unlockAfterTaskSlug,
      isActive: input.isActive ?? true,
    },
  });
}

type PetMutationInput = {
  id?: string;
  slug: string;
  nameZh: string;
  summaryZh: string;
  descriptionZh: string;
  rarity?: string;
  coverImageUrl?: string;
  modelGlbUrl?: string;
  sortOrder: number;
  isActive?: boolean;
};

type PetStageAssetMutationInput = Array<{
  id: string;
  nameZh: string;
  coverImageUrl?: string;
  modelGlbUrl?: string;
}>;

export async function createPet(input: Omit<PetMutationInput, "id">) {
  const existingBySlug = await prisma.petSpecies.findUnique({
    where: { slug: input.slug },
  });

  if (existingBySlug) {
    throw new Error(zhCN.actions.petSlugTaken);
  }

  return prisma.petSpecies.create({
    data: {
      slug: input.slug,
      nameZh: input.nameZh,
      summaryZh: input.summaryZh,
      descriptionZh: input.descriptionZh,
      rarity: input.rarity,
      coverImageUrl: input.coverImageUrl,
      modelGlbUrl: input.modelGlbUrl,
      sortOrder: input.sortOrder,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updatePet(input: PetMutationInput) {
  if (!input.id) {
    throw new Error(zhCN.actions.petNotFound);
  }

  const existingBySlug = await prisma.petSpecies.findUnique({
    where: { slug: input.slug },
  });

  if (existingBySlug && existingBySlug.id !== input.id) {
    throw new Error(zhCN.actions.petSlugTaken);
  }

  const pet = await prisma.petSpecies.findUnique({
    where: { id: input.id },
  });

  if (!pet) {
    throw new Error(zhCN.actions.petNotFound);
  }

  return prisma.petSpecies.update({
    where: { id: input.id },
    data: {
      slug: input.slug,
      nameZh: input.nameZh,
      summaryZh: input.summaryZh,
      descriptionZh: input.descriptionZh,
      rarity: input.rarity,
      coverImageUrl: input.coverImageUrl,
      modelGlbUrl: input.modelGlbUrl,
      sortOrder: input.sortOrder,
      isActive: input.isActive ?? pet.isActive,
    },
  });
}

export async function updatePetStagesAssets(petId: string, stages: PetStageAssetMutationInput) {
  if (stages.length === 0) {
    return [];
  }

  const pet = await prisma.petSpecies.findUnique({
    where: { id: petId },
    include: {
      stages: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!pet) {
    throw new Error(zhCN.actions.petNotFound);
  }

  const existingStageIds = new Set(pet.stages.map((stage) => stage.id));

  for (const stage of stages) {
    if (!existingStageIds.has(stage.id)) {
      throw new Error(zhCN.actions.petNotFound);
    }
  }

  await prisma.$transaction(
    stages.map((stage) =>
      prisma.petStage.update({
        where: { id: stage.id },
        data: {
          nameZh: stage.nameZh,
          coverImageUrl: stage.coverImageUrl,
          modelGlbUrl: stage.modelGlbUrl,
        },
      }),
    ),
  );
}

export async function togglePetActive(petId: string) {
  const pet = await prisma.petSpecies.findUnique({
    where: { id: petId },
  });

  if (!pet) {
    throw new Error(zhCN.actions.petNotFound);
  }

  return prisma.petSpecies.update({
    where: { id: petId },
    data: {
      isActive: !pet.isActive,
    },
  });
}

export async function saveShopItem(input: {
  id?: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  kind: ShopItemKind;
  priceBase: number;
  priceStep: number;
  isActive?: boolean;
}) {
  if (input.kind === "PET_SKIN") {
    throw new Error(zhCN.actions.petSkinAdminUnsupported);
  }

  const existingBySlug = await prisma.shopItem.findUnique({
    where: { slug: input.slug },
  });

  if (existingBySlug && existingBySlug.id !== input.id) {
    throw new Error(zhCN.actions.itemSlugTaken);
  }

  if (input.id) {
    const item = await prisma.shopItem.findUnique({
      where: { id: input.id },
    });

    if (!item) {
      throw new Error(zhCN.actions.itemNotFound);
    }

    if (item.kind !== input.kind) {
      throw new Error(zhCN.actions.itemKindImmutable);
    }

    return prisma.shopItem.update({
      where: { id: input.id },
      data: {
        slug: input.slug,
        nameZh: input.nameZh,
        descriptionZh: input.descriptionZh,
        priceBase: input.priceBase,
        priceStep: input.priceStep,
        isActive: input.isActive ?? item.isActive,
      },
    });
  }

  return prisma.shopItem.create({
    data: {
      slug: input.slug,
      nameZh: input.nameZh,
      descriptionZh: input.descriptionZh,
      kind: input.kind,
      priceBase: input.priceBase,
      priceStep: input.priceStep,
      isActive: input.isActive ?? true,
    },
  });
}

export async function toggleShopItemActive(itemId: string) {
  const item = await prisma.shopItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error(zhCN.actions.itemNotFound);
  }

  return prisma.shopItem.update({
    where: { id: itemId },
    data: {
      isActive: !item.isActive,
    },
  });
}

export async function updateRedeemCodeStatus(input: {
  code: string;
  status: RedeemCodeStatus;
  adminNote?: string;
}) {
  const code = await prisma.redeemCode.findUnique({
    where: { id: input.code },
  });

  if (!code) {
    throw new Error(zhCN.actions.itemNotFound);
  }

  if (code.status !== "ISSUED") {
    throw new Error(zhCN.actions.redeemCodeFinalized);
  }

  return prisma.redeemCode.update({
    where: { id: input.code },
    data: {
      status: input.status,
      adminNote: input.adminNote,
      redeemedAt: input.status === "REDEEMED" ? new Date() : null,
    },
  });
}

export async function resetUserData(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.userPet.deleteMany({
      where: { userId },
    });

    await tx.userPetSkin.deleteMany({
      where: { userId },
    });

    await tx.redeemCode.deleteMany({
      where: { userId },
    });

    await tx.userPurchase.deleteMany({
      where: { userId },
    });

    await tx.pointsLedger.deleteMany({
      where: { userId },
    });

    await tx.xpLedger.deleteMany({
      where: { userId },
    });

    await tx.dailyTaskCompletion.deleteMany({
      where: { userId },
    });

    await tx.dailyLog.deleteMany({
      where: { userId },
    });

    await tx.profile.upsert({
      where: { userId },
      create: { userId },
      update: {
        exp: 0,
        level: 1,
        points: 0,
        streak: 0,
        makeupCards: 0,
        purchaseCount: 0,
        completedTaskSlugsJson: "[]",
        completedTaskSlugsBackfilledAt: null,
        lastSettledDate: null,
        lastCompletedDate: null,
      },
    });
  });
}

export function runCompletedTaskSlugIndexSelfCheck() {
  const log = {
    completedTaskIds: JSON.stringify(["sleep-early", "missing-task", "sleep-early", "drink-water"]),
    tasksJson: serializeTaskSnapshots([
      {
        slug: "sleep-early",
        nameZh: "早睡",
        descriptionZh: "",
        exp: 1,
        points: 1,
      },
      {
        slug: "drink-water",
        nameZh: "喝水",
        descriptionZh: "",
        exp: 1,
        points: 1,
      },
      {
        slug: "stretch",
        nameZh: "拉伸",
        descriptionZh: "",
        exp: 1,
        points: 1,
      },
    ]),
  } satisfies Pick<DailyLog, "completedTaskIds" | "tasksJson">;

  assert.deepStrictEqual(getCompletedTaskSlugsFromLog(log), ["drink-water", "sleep-early"]);
  assert.deepStrictEqual(
    toSortedUniqueSlugs(["sleep-early", "drink-water", "sleep-early"]),
    ["drink-water", "sleep-early"],
  );
  assert.equal(
    shouldRunCompletionIndexBackfill({
      completedTaskSlugsJson: "[]",
      completedTaskSlugsBackfilledAt: null,
    } satisfies Pick<Profile, "completedTaskSlugsJson" | "completedTaskSlugsBackfilledAt">),
    true,
  );
  assert.equal(
    shouldRunCompletionIndexBackfill({
      completedTaskSlugsJson: "[]",
      completedTaskSlugsBackfilledAt: new Date(),
    } satisfies Pick<Profile, "completedTaskSlugsJson" | "completedTaskSlugsBackfilledAt">),
    false,
  );
}

export async function getDebugHealthState(userId: string) {
  runCompletedTaskSlugIndexSelfCheck();

  const availability = await getTaskAvailabilityForUserFromDb(prisma, userId);

  return {
    userId,
    profile: {
      level: availability.profile.level,
      points: availability.profile.points,
      completedTaskSlugsCount: getCompletedTaskSlugs(availability.profile).length,
    },
    tasksAvailableCount: availability.unlocked.length,
    lockedCount: availability.locked.length,
  };
}

export type DashboardState = Awaited<ReturnType<typeof getDashboardState>>;
export type AdminState = Awaited<ReturnType<typeof getAdminState>>;
export type UserWithProfile = User & { profile: Profile | null };
export type UserLog = DailyLog;
