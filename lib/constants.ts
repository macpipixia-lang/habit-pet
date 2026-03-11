export const APP_NAME = "Habit Pet";
export const MAX_LEVEL = 30;
export const EXP_PER_LEVEL = 100;
export const MAKEUP_CARD_BASE_PRICE = 50;
export const SHANGHAI_OFFSET_HOURS = 8;
export const TASK_TEMPLATE = [
  {
    id: "wake-up",
    title: "Wake up on time",
    description: "Start the day without snoozing past plan.",
    exp: 18,
    points: 10,
  },
  {
    id: "hydrate",
    title: "Drink water",
    description: "Finish your first full bottle before noon.",
    exp: 14,
    points: 8,
  },
  {
    id: "focus-block",
    title: "Complete a focus block",
    description: "Do one uninterrupted 25-minute session.",
    exp: 24,
    points: 12,
  },
  {
    id: "move-body",
    title: "Move your body",
    description: "Walk, stretch, or work out for 20 minutes.",
    exp: 20,
    points: 10,
  },
  {
    id: "shutdown",
    title: "Evening shutdown",
    description: "Review the day and plan tomorrow.",
    exp: 24,
    points: 15,
  },
] as const;
