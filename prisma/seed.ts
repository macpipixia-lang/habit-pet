import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialTaskDefinitions = [
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

async function main() {
  for (const task of initialTaskDefinitions) {
    await prisma.taskDefinition.upsert({
      where: { slug: task.slug },
      update: {
        nameZh: task.nameZh,
        descriptionZh: task.descriptionZh,
        exp: task.exp,
        points: task.points,
        unlockLevel: task.unlockLevel,
        unlockAfterTaskSlug: null,
        isActive: true,
      },
      create: {
        slug: task.slug,
        nameZh: task.nameZh,
        descriptionZh: task.descriptionZh,
        exp: task.exp,
        points: task.points,
        unlockLevel: task.unlockLevel,
        unlockAfterTaskSlug: null,
        isActive: true,
      },
    });
  }

  await prisma.shopItem.upsert({
    where: { slug: "makeup-card" },
    update: {
      nameZh: "补签卡",
      descriptionZh: "只能修复昨天的连续记录。每购买一次，价格线性增加。",
      kind: "MAKEUP_CARD",
      priceBase: 50,
      priceStep: 1,
      isActive: true,
    },
    create: {
      slug: "makeup-card",
      nameZh: "补签卡",
      descriptionZh: "只能修复昨天的连续记录。每购买一次，价格线性增加。",
      kind: "MAKEUP_CARD",
      priceBase: 50,
      priceStep: 1,
      isActive: true,
    },
  });

  await prisma.shopItem.upsert({
    where: { slug: "coffee-coupon" },
    update: {
      nameZh: "咖啡兑换券",
      descriptionZh: "兑换后生成唯一兑换码，可在线下或人工核销。",
      kind: "COUPON",
      priceBase: 120,
      priceStep: 0,
      isActive: true,
    },
    create: {
      slug: "coffee-coupon",
      nameZh: "咖啡兑换券",
      descriptionZh: "兑换后生成唯一兑换码，可在线下或人工核销。",
      kind: "COUPON",
      priceBase: 120,
      priceStep: 0,
      isActive: true,
    },
  });

  console.log("初始化完成。默认任务与商店商品已写入。");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
