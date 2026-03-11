import {
  DailyLog,
  Prisma,
  Profile,
  RedeemCodeStatus,
  ShopItemKind,
  User,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDaysToDateKey, getShanghaiDateParts } from "@/lib/time";
import {
  calculateNextStreak,
  calculateRewards,
  getDailyTaskTemplate,
  getLevelFromExp,
  getNextMakeupCardPrice,
  getShopItemPrice,
  normalizeTaskSelection,
  parseCompletedTaskIds,
  serializeTaskTemplate,
  shouldResetStreakForMissedDay,
} from "@/lib/game";
import { formatText, zhCN } from "@/lib/i18n/zhCN";

const SHOP_ITEM_INCLUDE = {
  purchases: true,
  redeemCodes: true,
} satisfies Prisma.ShopItemInclude;

type ShopItemRecord = Prisma.ShopItemGetPayload<{
  include: typeof SHOP_ITEM_INCLUDE;
}>;

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

function toShopItemView(item: ShopItemRecord, userId: string) {
  const purchaseCount = getItemPurchaseCountFromPurchases(item.purchases, userId);

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
    currentPrice: getShopItemPrice(item.priceBase, item.priceStep, purchaseCount),
  };
}

async function getActiveShopItemsWithUserState(userId: string) {
  const items = await prisma.shopItem.findMany({
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
    },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
  });

  return items.map((item) => toShopItemView(item as ShopItemRecord, userId));
}

export async function ensureProfile(userId: string) {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function ensureTodayLog(userId: string, date = getShanghaiDateParts().today) {
  return prisma.dailyLog.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    create: {
      userId,
      date,
      tasksJson: serializeTaskTemplate(),
    },
    update: {},
  });
}

export async function resetStreakIfNeeded(profile: Profile) {
  const { today } = getShanghaiDateParts();

  if (!shouldResetStreakForMissedDay(profile, today)) {
    return profile;
  }

  return prisma.profile.update({
    where: { id: profile.id },
    data: {
      streak: 0,
    },
  });
}

export async function getDashboardState(userId: string) {
  const [user, log, recentLogs, recentLedger, recentPurchases, recentRedeemCodes] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    }),
    ensureTodayLog(userId),
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
  ]);

  const profile = user.profile ? await resetStreakIfNeeded(user.profile) : await ensureProfile(userId);
  const shopItems = await getActiveShopItemsWithUserState(userId);
  const makeupCardItem = shopItems.find((item) => item.kind === "MAKEUP_CARD");

  return {
    user: {
      ...user,
      profile,
    },
    todayLog: log,
    recentLogs,
    recentLedger,
    recentPurchases,
    recentRedeemCodes,
    todayCompletedTaskIds: parseCompletedTaskIds(log),
    tasks: getDailyTaskTemplate(),
    nextShopPrice: makeupCardItem?.currentPrice ?? getNextMakeupCardPrice(profile.purchaseCount),
    shopItems,
  };
}

export async function updateTodayTaskSelection(userId: string, taskIds: string[]) {
  const { today } = getShanghaiDateParts();
  const log = await ensureTodayLog(userId, today);

  if (log.settledAt) {
    throw new Error(zhCN.actions.alreadySettledToday);
  }

  const normalized = normalizeTaskSelection(taskIds);

  return prisma.dailyLog.update({
    where: { id: log.id },
    data: {
      completedTaskIds: JSON.stringify(normalized),
    },
  });
}

export async function settleToday(userId: string) {
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

    const log = await tx.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        tasksJson: serializeTaskTemplate(),
      },
      update: {},
    });

    if (log.settledAt) {
      throw new Error(zhCN.actions.alreadySettledToday);
    }

    const completedTaskIds = parseCompletedTaskIds(log);
    const rewards = calculateRewards(completedTaskIds);
    const streak = calculateNextStreak(profile, today, completedTaskIds.length > 0);
    const nextExp = profile.exp + rewards.exp;
    const nextPoints = profile.points + rewards.points;
    const nextLevel = getLevelFromExp(nextExp);

    const updatedProfile = await tx.profile.update({
      where: { id: profile.id },
      data: {
        exp: nextExp,
        points: nextPoints,
        level: nextLevel,
        streak,
        lastSettledDate: today,
        lastCompletedDate: completedTaskIds.length > 0 ? today : profile.lastCompletedDate,
      },
    });

    const updatedLog = await tx.dailyLog.update({
      where: { id: log.id },
      data: {
        settledAt: new Date(),
        earnedExp: rewards.exp,
        earnedPoints: rewards.points,
        streakAfter: streak,
      },
    });

    if (rewards.points !== 0) {
      await tx.pointsLedger.create({
        data: {
          userId,
          delta: rewards.points,
          reason: "daily_settlement",
          description: formatText(zhCN.ledger.dailySettlement, { date: today }),
          metaJson: JSON.stringify({
            date: today,
            completedTaskIds,
            exp: rewards.exp,
          }),
        },
      });
    }

    return {
      profile: updatedProfile,
      log: updatedLog,
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
      }),
    ]);

    if (!item) {
      throw new Error(zhCN.actions.itemNotFound);
    }

    if (!item.isActive) {
      throw new Error(zhCN.actions.itemInactive);
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

    const ledgerReason = item.kind === "MAKEUP_CARD" ? "shop_makeup_card" : "shop_coupon";
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

    return {
      profile: updatedProfile,
      purchase,
      redeemCode,
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

    const todayLog = await tx.dailyLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (todayLog?.settledAt) {
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

    const rewards = calculateRewards(completedTaskIds);
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
        level: getLevelFromExp(nextExp),
        streak: restoredStreak,
        makeupCards: profile.makeupCards - 1,
        lastCompletedDate: yesterday,
        lastSettledDate: yesterday,
      },
    });

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
  const [items, redeemCodes] = await Promise.all([
    prisma.shopItem.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
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
    redeemCodes,
  };
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
    await tx.redeemCode.deleteMany({
      where: { userId },
    });

    await tx.userPurchase.deleteMany({
      where: { userId },
    });

    await tx.pointsLedger.deleteMany({
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
        lastSettledDate: null,
        lastCompletedDate: null,
      },
    });
  });
}

export type DashboardState = Awaited<ReturnType<typeof getDashboardState>>;
export type AdminState = Awaited<ReturnType<typeof getAdminState>>;
export type UserWithProfile = User & { profile: Profile | null };
export type UserLog = DailyLog;
