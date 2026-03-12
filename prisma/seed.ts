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

const petSpeciesSeeds = [
  {
    slug: "moss-fox",
    nameZh: "苔尾狐",
    descriptionZh: "喜欢在清晨收集露珠，尾巴像刚醒来的小森林。",
    rarity: "COMMON",
    stages: [
      { stageIndex: 0, nameZh: "露珠幼团", minXp: 0, imageKey: "moss-fox-0" },
      { stageIndex: 1, nameZh: "苔尾幼狐", minXp: 60, imageKey: "moss-fox-1" },
      { stageIndex: 2, nameZh: "林风守望者", minXp: 180, imageKey: "moss-fox-2" },
    ],
  },
  {
    slug: "sun-seal",
    nameZh: "晴团海豹",
    descriptionZh: "圆滚滚地晒太阳，越成长越像一颗会发光的午后。",
    rarity: "RARE",
    stages: [
      { stageIndex: 0, nameZh: "暖光团子", minXp: 0, imageKey: "sun-seal-0" },
      { stageIndex: 1, nameZh: "晴团海豹", minXp: 60, imageKey: "sun-seal-1" },
      { stageIndex: 2, nameZh: "潮汐领航员", minXp: 180, imageKey: "sun-seal-2" },
    ],
  },
  {
    slug: "plum-owl",
    nameZh: "梅影枭",
    descriptionZh: "夜里会安静盘旋，羽毛边缘像晚风里的花瓣。",
    rarity: "EPIC",
    stages: [
      { stageIndex: 0, nameZh: "花瓣雏影", minXp: 0, imageKey: "plum-owl-0" },
      { stageIndex: 1, nameZh: "梅影幼枭", minXp: 60, imageKey: "plum-owl-1" },
      { stageIndex: 2, nameZh: "夜庭巡羽", minXp: 180, imageKey: "plum-owl-2" },
    ],
  },
] as const;

const petSkinSeeds = [
  {
    slug: "moss-fox-spring-scarf",
    speciesSlug: "moss-fox",
    nameZh: "青芽围巾",
    descriptionZh: "给苔尾狐披上一圈春天的嫩叶围巾。",
    stageIndex: 0,
    imageKey: "moss-fox-spring-scarf",
    rarity: "RARE",
    shop: {
      slug: "skin-moss-fox-spring-scarf",
      priceBase: 150,
      priceStep: 0,
    },
  },
  {
    slug: "sun-seal-wave-float",
    speciesSlug: "sun-seal",
    nameZh: "晴波泳圈",
    descriptionZh: "让晴团海豹像带着一圈发光海浪。",
    stageIndex: 1,
    imageKey: "sun-seal-wave-float",
    rarity: "RARE",
    shop: {
      slug: "skin-sun-seal-wave-float",
      priceBase: 150,
      priceStep: 0,
    },
  },
  {
    slug: "plum-owl-night-cape",
    speciesSlug: "plum-owl",
    nameZh: "夜庭披风",
    descriptionZh: "为梅影枭添上一层带月色纹理的披风。",
    stageIndex: 2,
    imageKey: "plum-owl-night-cape",
    rarity: "EPIC",
    shop: {
      slug: "skin-plum-owl-night-cape",
      priceBase: 150,
      priceStep: 0,
    },
  },
] as const;

async function main() {
  await prisma.profile.updateMany({
    data: {
      completedTaskSlugsJson: "[]",
    },
  });

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

  await prisma.shopItem.upsert({
    where: { slug: "pet-egg" },
    update: {
      nameZh: "宠物蛋",
      descriptionZh: "购买后可从当前可选物种中挑选一只，并立即获得该宠物。",
      kind: "PET_EGG",
      priceBase: 200,
      priceStep: 0,
      isActive: true,
    },
    create: {
      slug: "pet-egg",
      nameZh: "宠物蛋",
      descriptionZh: "购买后可从当前可选物种中挑选一只，并立即获得该宠物。",
      kind: "PET_EGG",
      priceBase: 200,
      priceStep: 0,
      isActive: true,
    },
  });

  for (const species of petSpeciesSeeds) {
    const savedSpecies = await prisma.petSpecies.upsert({
      where: { slug: species.slug },
      update: {
        nameZh: species.nameZh,
        descriptionZh: species.descriptionZh,
        rarity: species.rarity,
        isActive: true,
      },
      create: {
        slug: species.slug,
        nameZh: species.nameZh,
        descriptionZh: species.descriptionZh,
        rarity: species.rarity,
        isActive: true,
      },
    });

    for (const stage of species.stages) {
      await prisma.petStage.upsert({
        where: {
          speciesId_stageIndex: {
            speciesId: savedSpecies.id,
            stageIndex: stage.stageIndex,
          },
        },
        update: {
          nameZh: stage.nameZh,
          minXp: stage.minXp,
          imageKey: stage.imageKey,
        },
        create: {
          speciesId: savedSpecies.id,
          stageIndex: stage.stageIndex,
          nameZh: stage.nameZh,
          minXp: stage.minXp,
          imageKey: stage.imageKey,
        },
      });
    }
  }

  for (const skin of petSkinSeeds) {
    const species = await prisma.petSpecies.findUnique({
      where: { slug: skin.speciesSlug },
      select: { id: true },
    });

    if (!species) {
      throw new Error(`Missing species for skin seed: ${skin.slug}`);
    }

    const savedSkin = await prisma.petSkin.upsert({
      where: { slug: skin.slug },
      update: {
        nameZh: skin.nameZh,
        descriptionZh: skin.descriptionZh,
        speciesId: species.id,
        stageIndex: skin.stageIndex,
        imageKey: skin.imageKey,
        rarity: skin.rarity,
        isActive: true,
      },
      create: {
        slug: skin.slug,
        nameZh: skin.nameZh,
        descriptionZh: skin.descriptionZh,
        speciesId: species.id,
        stageIndex: skin.stageIndex,
        imageKey: skin.imageKey,
        rarity: skin.rarity,
        isActive: true,
      },
    });

    await prisma.shopItem.upsert({
      where: { slug: skin.shop.slug },
      update: {
        nameZh: skin.nameZh,
        descriptionZh: skin.descriptionZh,
        kind: "PET_SKIN",
        petSkinId: savedSkin.id,
        priceBase: skin.shop.priceBase,
        priceStep: skin.shop.priceStep,
        isActive: true,
      },
      create: {
        slug: skin.shop.slug,
        nameZh: skin.nameZh,
        descriptionZh: skin.descriptionZh,
        kind: "PET_SKIN",
        petSkinId: savedSkin.id,
        priceBase: skin.shop.priceBase,
        priceStep: skin.shop.priceStep,
        isActive: true,
      },
    });
  }

  console.log("初始化完成。默认任务、商店商品、宠物图鉴和皮肤已写入。");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
