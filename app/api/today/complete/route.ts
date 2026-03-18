import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { completeDailyTask, getDashboardState } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { dailyTaskActionSchema } from "@/lib/validation";
import { revalidatePaths } from "@/app/api/_utils";

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return zhCN.feedback.fallbackError;
}

export async function POST(request: Request) {
  const user = await requireUser({ unauthorized: "return-null" });

  if (!user) {
    return NextResponse.json({ ok: false, error: zhCN.debug.unauthorized }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = dailyTaskActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput },
        { status: 400 },
      );
    }

    const result = await completeDailyTask(user.id, parsed.data.taskSlug);
    revalidatePaths("/today", "/pet", "/pet/3d", "/shop", "/history", "/backpack", "/dashboard");
    const profileSummary =
      "profile" in result && result.profile
        ? {
            streak: result.profile.streak,
            level: result.profile.level,
            exp: result.profile.exp,
            points: result.profile.points,
          }
        : (() => null)();

    if (profileSummary) {
      return NextResponse.json({
        ok: true,
        taskSlug: parsed.data.taskSlug,
        status: result.status,
        profileSummary,
      });
    }

    const state = await getDashboardState(user.id);

    return NextResponse.json({
      ok: true,
      taskSlug: parsed.data.taskSlug,
      status: result.status,
      profileSummary: {
        streak: state.user.profile!.streak,
        level: state.user.profile!.level,
        exp: state.user.profile!.exp,
        points: state.user.profile!.points,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: toMessage(error) }, { status: 500 });
  }
}
