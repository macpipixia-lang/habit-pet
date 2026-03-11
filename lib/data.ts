import { DailyLog, Profile, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDaysToDateKey, getShanghaiDateParts } from "@/lib/time";
import {
  calculateNextStreak,
  calculateRewards,
  getDailyTaskTemplate,
  getLevelFromExp,
  getNextMakeupCardPrice,
  normalizeTaskSelection,
  parseCompletedTaskIds,
  serializeTaskTemplate,
  shouldResetStreakForMissedDay,
} from "@/lib/game";

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
  const [user, log, recentLogs, recentLedger] = await Promise.all([
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
  ]);

  const profile = user.profile ? await resetStreakIfNeeded(user.profile) : await ensureProfile(userId);

  return {
    user: {
      ...user,
      profile,
    },
    todayLog: log,
    recentLogs,
    recentLedger,
    todayCompletedTaskIds: parseCompletedTaskIds(log),
    tasks: getDailyTaskTemplate(),
    nextShopPrice: getNextMakeupCardPrice(profile.purchaseCount),
  };
}

export async function updateTodayTaskSelection(userId: string, taskIds: string[]) {
  const { today } = getShanghaiDateParts();
  const log = await ensureTodayLog(userId, today);

  if (log.settledAt) {
    throw new Error("Today has already been settled.");
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
      throw new Error("Today has already been settled.");
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
          description: `Daily settlement for ${today}`,
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

export async function purchaseMakeupCard(userId: string) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const cost = getNextMakeupCardPrice(profile.purchaseCount);

    if (profile.points < cost) {
      throw new Error("Not enough points for a makeup card.");
    }

    const updatedProfile = await tx.profile.update({
      where: { id: profile.id },
      data: {
        points: profile.points - cost,
        makeupCards: profile.makeupCards + 1,
        purchaseCount: profile.purchaseCount + 1,
      },
    });

    await tx.pointsLedger.create({
      data: {
        userId,
        delta: -cost,
        reason: "shop_makeup_card",
        description: "Purchased 1 makeup card",
        metaJson: JSON.stringify({ cost }),
      },
    });

    return updatedProfile;
  });
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
      throw new Error("You do not have any makeup cards.");
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
      throw new Error("No log exists for yesterday.");
    }

    if (yesterdayLog.settledAt) {
      throw new Error("Yesterday is already settled.");
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
      throw new Error("Use the makeup card before settling today.");
    }

    const completedTaskIds = parseCompletedTaskIds(yesterdayLog);

    if (completedTaskIds.length === 0) {
      throw new Error("Yesterday has no completed tasks to restore.");
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
          description: `Makeup settlement for ${yesterday}`,
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
          description: `Used 1 makeup card for ${yesterday}`,
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

export async function resetUserData(userId: string) {
  return prisma.$transaction(async (tx) => {
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
export type UserWithProfile = User & { profile: Profile | null };
export type UserLog = DailyLog;
