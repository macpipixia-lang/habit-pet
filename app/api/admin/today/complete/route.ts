import { adminDailyTaskAuditSchema } from "@/lib/validation";
import { adminCompleteDailyTask, getAdminTodayAuditState } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = adminDailyTaskAuditSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await adminCompleteDailyTask(parsed.data.userQuery, parsed.data.taskSlug, "admin");
    const state = await getAdminTodayAuditState(parsed.data.userQuery);
    revalidateAdminPaths("/admin", "/admin/today", "/today", "/dashboard", "/shop", "/backpack", "/pet", "/pet/3d", "/history");
    return ok(state, zhCN.feedback.taskAuditUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
