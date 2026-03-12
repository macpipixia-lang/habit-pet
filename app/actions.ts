"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getAdminRedirectTarget } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  activePetSchema,
  adminCodeUpdateSchema,
  adminLoginSchema,
  adminShopItemSchema,
  adminTaskDefinitionSchema,
  authSchema,
  petEggPurchaseSchema,
  shopPurchaseSchema,
} from "@/lib/validation";
import {
  clearAdminSession,
  clearSession,
  createAdminSession,
  createSession,
  hashPassword,
  requireAdmin,
  requireUser,
  verifyAdminSecret,
  verifyPassword,
} from "@/lib/auth";
import {
  ensureProfile,
  purchasePetEgg,
  purchaseMakeupCard,
  purchaseShopItem,
  saveShopItem,
  saveTaskDefinition,
  setActivePet,
  settleToday,
  toggleShopItemActive,
  updateRedeemCodeStatus,
  updateTodayTaskSelection,
  useYesterdayMakeupCard,
} from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export type AuthActionState = {
  error?: string;
};

export type AdminActionState = {
  error?: string;
};

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return zhCN.feedback.fallbackError;
}

function rethrowIfRedirect(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (existing) {
    return { error: zhCN.actions.usernameTaken };
  }

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: hashPassword(parsed.data.password),
    },
  });

  await ensureProfile(user.id);
  await createSession(user.id);
  redirect("/today");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    include: { profile: true },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: zhCN.actions.invalidCredentials };
  }

  await createSession(user.id);
  redirect("/today");
}

export async function adminLoginAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = adminLoginSchema.safeParse({
    secret: formData.get("secret"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput };
  }

  if (!verifyAdminSecret(parsed.data.secret)) {
    return { error: zhCN.actions.invalidAdminSecret };
  }

  await createAdminSession();
  redirect("/admin?success=login");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin?success=logout");
}

function extractTaskIds(formData: FormData) {
  return formData
    .getAll("taskIds")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function saveTasksAction(formData: FormData) {
  try {
    const user = await requireUser();
    await updateTodayTaskSelection(user.id, extractTaskIds(formData));
    revalidatePath("/today");
    redirect("/today?success=progress-saved");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/today?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function settleTodayAction(formData: FormData) {
  try {
    const user = await requireUser();
    await updateTodayTaskSelection(user.id, extractTaskIds(formData));
    await settleToday(user.id);
    revalidatePath("/today");
    revalidatePath("/pet");
    revalidatePath("/history");
    revalidatePath("/shop");
    redirect("/today?success=settled");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/today?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function purchaseShopItemAction(formData: FormData) {
  try {
    const user = await requireUser();
    const parsed = shopPurchaseSchema.safeParse({
      itemId: formData.get("itemId"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const result = await purchaseShopItem(user.id, parsed.data.itemId);
    revalidatePath("/shop");
    revalidatePath("/today");
    revalidatePath("/pet");
    revalidatePath("/history");

    if (result.redeemCode) {
      redirect(
        `/shop?success=coupon-purchased&code=${encodeURIComponent(result.redeemCode.id)}&item=${encodeURIComponent(
          result.purchase.item.nameZh,
        )}`,
      );
    }

    redirect("/shop?success=purchased");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/shop?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function buyMakeupCardAction(_formData: FormData) {
  try {
    const user = await requireUser();
    await purchaseMakeupCard(user.id);
    revalidatePath("/shop");
    revalidatePath("/today");
    revalidatePath("/pet");
    revalidatePath("/history");
    redirect("/shop?success=purchased");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/shop?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function purchasePetEggAction(formData: FormData) {
  try {
    const user = await requireUser();
    const parsed = petEggPurchaseSchema.safeParse({
      itemId: formData.get("itemId"),
      speciesId: formData.get("speciesId"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await purchasePetEgg(user.id, parsed.data.itemId, parsed.data.speciesId);
    revalidatePath("/shop");
    revalidatePath("/shop/pet-egg");
    revalidatePath("/pet");
    revalidatePath("/pokedex");
    revalidatePath("/history");
    redirect("/pet?success=pet-unlocked");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/shop/pet-egg?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function setActivePetAction(formData: FormData) {
  try {
    const user = await requireUser();
    const parsed = activePetSchema.safeParse({
      userPetId: formData.get("userPetId"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await setActivePet(user.id, parsed.data.userPetId);
    revalidatePath("/pet");
    revalidatePath("/today");
    redirect("/pet?success=active-pet-updated");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/pet?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function useMakeupCardAction(_formData: FormData) {
  try {
    const user = await requireUser();
    await useYesterdayMakeupCard(user.id);
    revalidatePath("/today");
    revalidatePath("/pet");
    revalidatePath("/shop");
    revalidatePath("/history");
    redirect("/today?success=makeup-used");
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`/today?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function saveShopItemAction(formData: FormData) {
  const redirectTo = getAdminRedirectTarget(formData.get("redirectTo"));

  try {
    await requireAdmin();
    const parsed = adminShopItemSchema.safeParse({
      id: formData.get("id") || undefined,
      slug: formData.get("slug"),
      nameZh: formData.get("nameZh"),
      descriptionZh: formData.get("descriptionZh"),
      kind: formData.get("kind"),
      priceBase: formData.get("priceBase"),
      priceStep: formData.get("priceStep"),
      isActive: formData.get("isActive"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await saveShopItem(parsed.data);
    revalidatePath("/shop");
    revalidatePath("/admin");
    revalidatePath("/admin/items");
    redirect(`${redirectTo}?success=item-saved`);
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`${redirectTo}?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function saveTaskDefinitionAction(formData: FormData) {
  const redirectTo = getAdminRedirectTarget(formData.get("redirectTo"));

  try {
    await requireAdmin();
    const parsed = adminTaskDefinitionSchema.safeParse({
      id: formData.get("id") || undefined,
      slug: formData.get("slug"),
      nameZh: formData.get("nameZh"),
      descriptionZh: formData.get("descriptionZh"),
      exp: formData.get("exp"),
      points: formData.get("points"),
      unlockLevel: formData.get("unlockLevel"),
      unlockAfterTaskSlug: formData.get("unlockAfterTaskSlug"),
      isActive: formData.get("isActive"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await saveTaskDefinition(parsed.data);
    revalidatePath("/admin");
    revalidatePath("/admin/tasks");
    revalidatePath("/today");
    redirect(`${redirectTo}?success=task-saved`);
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`${redirectTo}?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function toggleShopItemActiveAction(formData: FormData) {
  const redirectTo = getAdminRedirectTarget(formData.get("redirectTo"));

  try {
    await requireAdmin();
    const itemId = String(formData.get("itemId") ?? "");

    if (!itemId) {
      throw new Error(zhCN.feedback.invalidInput);
    }

    await toggleShopItemActive(itemId);
    revalidatePath("/shop");
    revalidatePath("/admin");
    revalidatePath("/admin/items");
    redirect(`${redirectTo}?success=item-status-updated`);
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`${redirectTo}?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function updateRedeemCodeStatusAction(formData: FormData) {
  const redirectTo = getAdminRedirectTarget(formData.get("redirectTo"));

  try {
    await requireAdmin();
    const parsed = adminCodeUpdateSchema.safeParse({
      code: formData.get("code"),
      status: formData.get("status"),
      adminNote: formData.get("adminNote"),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await updateRedeemCodeStatus(parsed.data);
    revalidatePath("/admin");
    revalidatePath("/admin/codes");
    revalidatePath("/history");
    redirect(`${redirectTo}?success=code-updated`);
  } catch (error) {
    rethrowIfRedirect(error);
    redirect(`${redirectTo}?error=${encodeURIComponent(toMessage(error))}`);
  }
}
