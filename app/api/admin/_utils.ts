import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return zhCN.feedback.fallbackError;
}

export async function requireAdminApi() {
  const isAdmin = await requireAdmin({ unauthorized: "return-null" });

  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, message: zhCN.actions.invalidAdminSecret },
      { status: 401 },
    );
  }

  return null;
}

export function ok<T>(data?: T, message?: string) {
  return NextResponse.json({
    ok: true,
    ...(message ? { message } : {}),
    ...(data === undefined ? {} : { data }),
  });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export function revalidateAdminPaths(...paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}
