import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resetUserData } from "@/lib/data";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await resetUserData(user.id);
  return NextResponse.json({ ok: true });
}
