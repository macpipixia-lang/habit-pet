import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDebugHealthState } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: zhCN.debug.notFound }, { status: 404 });
  }

  const user = await requireUser({ unauthorized: "return-null" });

  if (!user) {
    return NextResponse.json({ error: zhCN.debug.unauthorized }, { status: 401 });
  }

  const health = await getDebugHealthState(user.id);
  return NextResponse.json({ ok: true, ...health });
}
