import { DailyLog, Profile, User } from "@prisma/client";
import { MAX_LEVEL, EXP_PER_LEVEL, MAKEUP_CARD_BASE_PRICE, TASK_TEMPLATE } from "@/lib/constants";
import { addDaysToDateKey, compareDateKeys } from "@/lib/time";

export type TaskTemplateItem = (typeof TASK_TEMPLATE)[number];

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

export function getDailyTaskTemplate() {
  return TASK_TEMPLATE.map((task) => ({ ...task }));
}

export function normalizeTaskSelection(taskIds: string[]) {
  const validIds = new Set<string>(TASK_TEMPLATE.map((task) => task.id));
  return [...new Set(taskIds.filter((taskId) => validIds.has(taskId)))];
}

export function calculateRewards(taskIds: string[]) {
  const selected = new Set(taskIds);

  return TASK_TEMPLATE.reduce(
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

export function serializeTaskTemplate() {
  return JSON.stringify(getDailyTaskTemplate());
}

export function parseCompletedTaskIds(log: DailyLog) {
  return JSON.parse(log.completedTaskIds) as string[];
}

export function toTodayViewModel(params: {
  user: User & { profile: Profile | null };
  log: DailyLog;
}) {
  const { user, log } = params;
  const completedTaskIds = parseCompletedTaskIds(log);
  const rewards = calculateRewards(completedTaskIds);

  return {
    userId: user.id,
    profile: user.profile,
    log,
    completedTaskIds,
    rewards,
    tasks: getDailyTaskTemplate(),
    levelProgress: getExpIntoCurrentLevel(user.profile?.exp ?? 0),
    nextShopPrice: getNextMakeupCardPrice(user.profile?.purchaseCount ?? 0),
  };
}
