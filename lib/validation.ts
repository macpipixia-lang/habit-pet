import { z } from "zod";
import { zhCN } from "@/lib/i18n/zhCN";

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
  kind: z.enum(["MAKEUP_CARD", "COUPON"], { message: zhCN.feedback.invalidInput }),
  priceBase: z.coerce.number().int().min(0, zhCN.validation.priceMin),
  priceStep: z.coerce.number().int().min(0, zhCN.validation.priceMin),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
});

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
