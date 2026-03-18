import { z } from "zod";
import { zhCN } from "@/lib/i18n/zhCN";

const adminBooleanFieldSchema = z.preprocess(
  (value) => {
    if (value == null || value === "") {
      return undefined;
    }

    return value;
  },
  z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
);

export const authSchema = z.object({
  username: z
    .string()
    .min(3, zhCN.validation.usernameMin)
    .max(24, zhCN.validation.usernameMax)
    .regex(/^[a-zA-Z0-9_]+$/, zhCN.validation.usernamePattern),
  password: z.string().min(6, zhCN.validation.passwordMin),
});

export const shopPurchaseSchema = z.object({
  itemId: z.string().min(1, zhCN.feedback.invalidInput),
});

export const petEggPurchaseSchema = z.object({
  itemId: z.string().min(1, zhCN.feedback.invalidInput),
  speciesId: z.string().min(1, zhCN.feedback.invalidInput),
});

export const starterPetGrantSchema = z.object({
  speciesId: z.string().min(1, zhCN.feedback.invalidInput),
});

export const activePetSchema = z.object({
  userPetId: z.string().min(1, zhCN.feedback.invalidInput),
});

export const petNicknameSchema = z.object({
  userPetId: z.string().min(1, zhCN.feedback.invalidInput),
  nickname: z
    .string()
    .trim()
    .max(12, zhCN.validation.petNicknameMax)
    .regex(/^[\p{Script=Han}A-Za-z0-9 ]*$/u, zhCN.validation.petNicknamePattern),
});

export const petSkinApplySchema = z.object({
  userPetId: z.string().min(1, zhCN.feedback.invalidInput),
  skinId: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export const appRedirectSchema = z
  .enum(["/pet", "/backpack"])
  .optional()
  .transform((value) => value ?? "/pet");

export const dailyTaskActionSchema = z.object({
  taskSlug: z
    .string()
    .min(2, zhCN.validation.taskSlugMin)
    .max(48, zhCN.validation.taskSlugMax)
    .regex(/^[a-z0-9-]+$/, zhCN.validation.taskSlugPattern),
});

export const adminDailyTaskAuditSchema = z.object({
  userQuery: z.string().trim().min(1, zhCN.feedback.invalidInput),
  taskSlug: z
    .string()
    .min(2, zhCN.validation.taskSlugMin)
    .max(48, zhCN.validation.taskSlugMax)
    .regex(/^[a-z0-9-]+$/, zhCN.validation.taskSlugPattern),
});

export const adminUserQuerySchema = z.object({
  userQuery: z.string().trim().min(1, zhCN.feedback.invalidInput),
});

export const adminLoginSchema = z.object({
  secret: z.string().min(1, zhCN.feedback.invalidInput),
});

export const adminShopItemSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, zhCN.validation.shopSlugMin)
    .max(48, zhCN.validation.shopSlugMax)
    .regex(/^[a-z0-9-]+$/, zhCN.validation.shopSlugPattern),
  nameZh: z.string().min(1, zhCN.validation.shopNameRequired),
  descriptionZh: z.string().min(1, zhCN.validation.shopDescriptionRequired),
  kind: z.enum(["MAKEUP_CARD", "COUPON", "PET_EGG", "PET_SKIN"], { message: zhCN.feedback.invalidInput }),
  priceBase: z.coerce.number().int().min(0, zhCN.validation.priceMin),
  priceStep: z.coerce.number().int().min(0, zhCN.validation.priceMin),
  isActive: adminBooleanFieldSchema,
});

export const adminTaskDefinitionSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, zhCN.validation.taskSlugMin)
    .max(48, zhCN.validation.taskSlugMax)
    .regex(/^[a-z0-9-]+$/, zhCN.validation.taskSlugPattern),
  nameZh: z.string().min(1, zhCN.validation.taskNameRequired),
  descriptionZh: z.string().min(1, zhCN.validation.taskDescriptionRequired),
  exp: z.coerce.number().int().min(0, zhCN.validation.rewardMin),
  points: z.coerce.number().int().min(0, zhCN.validation.rewardMin),
  unlockLevel: z.coerce.number().int().min(1, zhCN.validation.unlockLevelMin),
  unlockAfterTaskSlug: z
    .string()
    .trim()
    .max(48, zhCN.validation.taskSlugMax)
    .regex(/^[a-z0-9-]*$/, zhCN.validation.taskSlugPattern)
    .optional()
    .transform((value) => value || undefined),
  isActive: adminBooleanFieldSchema,
});

export const adminPetSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, zhCN.validation.petSlugMin)
    .max(48, zhCN.validation.petSlugMax)
    .regex(/^[a-z0-9-]+$/, zhCN.validation.petSlugPattern),
  nameZh: z.string().min(1, zhCN.validation.petNameRequired),
  summaryZh: z.string().trim().max(120, zhCN.validation.petSummaryMax),
  descriptionZh: z.string().min(1, zhCN.validation.petDescriptionRequired),
  rarity: z
    .string()
    .trim()
    .max(32, zhCN.validation.petRarityMax)
    .optional()
    .transform((value) => value || undefined),
  coverImageUrl: z
    .string()
    .trim()
    .url(zhCN.validation.petAssetUrlInvalid)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  modelGlbUrl: z
    .string()
    .trim()
    .url(zhCN.validation.petAssetUrlInvalid)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  sortOrder: z.coerce.number().int().min(0, zhCN.validation.sortOrderMin),
  isActive: adminBooleanFieldSchema,
});

export const adminPetStageAssetsSchema = z.array(
  z.object({
    id: z.string().min(1, zhCN.feedback.invalidInput),
    nameZh: z.string().trim().min(1, zhCN.validation.petStageNameRequired),
    coverImageUrl: z
      .string()
      .trim()
      .url(zhCN.validation.petAssetUrlInvalid)
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    modelGlbUrl: z
      .string()
      .trim()
      .url(zhCN.validation.petAssetUrlInvalid)
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
  }),
);

export const adminCodeUpdateSchema = z.object({
  code: z.string().uuid(zhCN.validation.codeInvalid),
  status: z.enum(["REDEEMED", "VOID"], { message: zhCN.feedback.invalidInput }),
  adminNote: z
    .string()
    .trim()
    .max(200, zhCN.validation.adminNoteMax)
    .optional()
    .transform((value) => value || undefined),
});
