import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return zhCN.feedback.fallbackError;
}

export async function requireUserApi() {
  const user = await requireUser({ unauthorized: "return-null" });

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ ok: false, message: zhCN.debug.unauthorized }, { status: 401 }),
    };
  }

  return {
    user,
    response: null,
  };
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

export function revalidatePaths(...paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}
