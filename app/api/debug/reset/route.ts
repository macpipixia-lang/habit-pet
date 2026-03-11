import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resetUserData } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: zhCN.debug.notFound }, { status: 404 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: zhCN.debug.unauthorized }, { status: 401 });
  }

  await resetUserData(user.id);
  return NextResponse.json({ ok: true });
}
