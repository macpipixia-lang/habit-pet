import { DailyLog, Profile, TaskDefinition, User } from "@prisma/client";
import { EXP_PER_LEVEL, MAKEUP_CARD_BASE_PRICE, MAX_LEVEL } from "@/lib/constants";
import { addDaysToDateKey, compareDateKeys } from "@/lib/time";

export type DailyTaskSnapshot = {
  id: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  exp: number;
  points: number;
};

type StoredTaskSnapshot = {
  slug?: unknown;
  nameZh?: unknown;
  descriptionZh?: unknown;
  exp?: unknown;
  points?: unknown;
  id?: unknown;
  title?: unknown;
  description?: unknown;
};

export function getLevelFromExp(exp: number) {
  const computedLevel = Math.floor(exp / EXP_PER_LEVEL) + 1;
  return Math.min(computedLevel, MAX_LEVEL);
}

export function getExpIntoCurrentLevel(exp: number) {
  if (getLevelFromExp(exp) >= MAX_LEVEL) {
    return EXP_PER_LEVEL;
  }

  return exp % EXP_PER_LEVEL;
}

export function getNextMakeupCardPrice(purchaseCount: number) {
  return MAKEUP_CARD_BASE_PRICE + purchaseCount;
}

export function getShopItemPrice(priceBase: number, priceStep: number, purchaseCount: number) {
  return priceBase + purchaseCount * priceStep;
}

export function mapTaskDefinitionToDailyTaskSnapshot(task: Pick<TaskDefinition, "slug" | "nameZh" | "descriptionZh" | "exp" | "points">) {
  return {
    slug: task.slug,
    nameZh: task.nameZh,
    descriptionZh: task.descriptionZh,
    exp: task.exp,
    points: task.points,
  };
}

function isDailyTaskSnapshot(value: StoredTaskSnapshot): value is StoredTaskSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    (typeof value.slug === "string" || typeof value.id === "string")
  );
}

export function parseTasksJson(tasksJson: string): DailyTaskSnapshot[] {
  try {
    const parsed = JSON.parse(tasksJson) as StoredTaskSnapshot[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isDailyTaskSnapshot)
      .map((task) => {
        const slug = typeof task.slug === "string" ? task.slug : String(task.id ?? "");
        const nameZh = typeof task.nameZh === "string" ? task.nameZh : String(task.title ?? "");
        const descriptionZh =
          typeof task.descriptionZh === "string" ? task.descriptionZh : String(task.description ?? "");

        return {
          id: slug,
          slug,
          nameZh,
          descriptionZh,
          exp: typeof task.exp === "number" ? task.exp : 0,
          points: typeof task.points === "number" ? task.points : 0,
        };
      })
      .filter((task) => task.id.length > 0);
  } catch {
    return [];
  }
}

export function serializeTaskSnapshots(tasks: Array<Pick<DailyTaskSnapshot, "slug" | "nameZh" | "descriptionZh" | "exp" | "points">>) {
  return JSON.stringify(
    tasks.map((task) => ({
      slug: task.slug,
      nameZh: task.nameZh,
      descriptionZh: task.descriptionZh,
      exp: task.exp,
      points: task.points,
    })),
  );
}

export function normalizeTaskSelection(taskIds: string[], tasks: DailyTaskSnapshot[]) {
  const validIds = new Set<string>(tasks.map((task) => task.id));
  return [...new Set(taskIds.filter((taskId) => validIds.has(taskId)))];
}

export function calculateRewards(taskIds: string[], tasks: DailyTaskSnapshot[]) {
  const selected = new Set(taskIds);

  return tasks.reduce(
    (acc, task) => {
      if (selected.has(task.id)) {
        acc.exp += task.exp;
        acc.points += task.points;
      }

      return acc;
    },
    { exp: 0, points: 0 },
  );
}

export function calculateNextStreak(profile: Profile, settlementDate: string, completedAnyTask: boolean) {
  if (!completedAnyTask) {
    return 0;
  }

  if (!profile.lastCompletedDate) {
    return 1;
  }

  const expected = addDaysToDateKey(profile.lastCompletedDate, 1);
  return expected === settlementDate ? profile.streak + 1 : 1;
}

export function shouldResetStreakForMissedDay(profile: Profile, today: string) {
  if (!profile.lastCompletedDate) {
    return false;
  }

  return compareDateKeys(addDaysToDateKey(profile.lastCompletedDate, 1), today) < 0 && profile.streak !== 0;
}

export function parseCompletedTaskIds(log: DailyLog) {
  try {
    const parsed = JSON.parse(log.completedTaskIds) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function parseStringArrayJson(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is string => typeof item === "string"))] : [];
  } catch {
    return [];
  }
}

export function toTodayViewModel(params: {
  user: User & { profile: Profile | null };
  log: DailyLog;
}) {
  const { user, log } = params;
  const tasks = parseTasksJson(log.tasksJson);
  const completedTaskIds = parseCompletedTaskIds(log);
  const rewards = calculateRewards(completedTaskIds, tasks);

  return {
    userId: user.id,
    profile: user.profile,
    log,
    completedTaskIds,
    rewards,
    tasks,
    levelProgress: getExpIntoCurrentLevel(user.profile?.exp ?? 0),
    nextShopPrice: getNextMakeupCardPrice(user.profile?.purchaseCount ?? 0),
  };
}
