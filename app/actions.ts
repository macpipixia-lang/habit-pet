"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validation";
import { clearSession, createSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import {
  ensureProfile,
  purchaseMakeupCard,
  settleToday,
  updateTodayTaskSelection,
  useYesterdayMakeupCard,
} from "@/lib/data";

type AuthActionState = {
  error?: string;
};

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (existing) {
    return { error: "Username is already taken." };
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    include: { profile: true },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "Invalid username or password." };
  }

  await createSession(user.id);
  redirect("/today");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
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
