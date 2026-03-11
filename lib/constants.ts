export const APP_NAME = "习惯宠物";
export const MAX_LEVEL = 30;
export const EXP_PER_LEVEL = 100;
export const MAKEUP_CARD_BASE_PRICE = 50;
export const SHANGHAI_OFFSET_HOURS = 8;
export const INITIAL_TASK_DEFINITIONS = [
  {
    slug: "wake-up",
    nameZh: "按时起床",
    descriptionZh: "不赖床，按计划开启今天。",
    exp: 18,
    points: 10,
    unlockLevel: 1,
  },
  {
    slug: "hydrate",
    nameZh: "主动喝水",
    descriptionZh: "中午前喝完今天的第一整瓶水。",
    exp: 14,
    points: 8,
    unlockLevel: 1,
  },
  {
    slug: "focus-block",
    nameZh: "完成一轮专注",
    descriptionZh: "完成一次不被打断的 25 分钟专注时段。",
    exp: 24,
    points: 12,
    unlockLevel: 1,
  },
  {
    slug: "move-body",
    nameZh: "活动身体",
    descriptionZh: "散步、拉伸或运动 20 分钟。",
    exp: 20,
    points: 10,
    unlockLevel: 1,
  },
  {
    slug: "shutdown",
    nameZh: "晚间收尾",
    descriptionZh: "回顾今天，并安排明天的计划。",
    exp: 24,
    points: 15,
    unlockLevel: 1,
  },
] as const;
