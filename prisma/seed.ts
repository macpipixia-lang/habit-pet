import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  console.log("初始化完成。默认商店商品已写入。");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
