export const APP_NAME = "习惯宠物";
export const MAX_LEVEL = 30;
export const EXP_PER_LEVEL = 100;
export const MAKEUP_CARD_BASE_PRICE = 50;
export const SHANGHAI_OFFSET_HOURS = 8;
export const TASK_TEMPLATE = [
  {
    id: "wake-up",
    title: "按时起床",
    description: "不赖床，按计划开启今天。",
    exp: 18,
    points: 10,
  },
  {
    id: "hydrate",
    title: "主动喝水",
    description: "中午前喝完今天的第一整瓶水。",
    exp: 14,
    points: 8,
  },
  {
    id: "focus-block",
    title: "完成一轮专注",
    description: "完成一次不被打断的 25 分钟专注时段。",
    exp: 24,
    points: 12,
  },
  {
    id: "move-body",
    title: "活动身体",
    description: "散步、拉伸或运动 20 分钟。",
    exp: 20,
    points: 10,
  },
  {
    id: "shutdown",
    title: "晚间收尾",
    description: "回顾今天，并安排明天的计划。",
    exp: 24,
    points: 15,
  },
] as const;
