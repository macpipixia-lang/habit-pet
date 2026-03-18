import { adminUserQuerySchema } from "@/lib/validation";
import { adminSyncTodayTasks } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = adminUserQuerySchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const result = await adminSyncTodayTasks(parsed.data.userQuery);
    revalidateAdminPaths("/admin", "/admin/tasks", "/admin/today", "/dashboard", "/today");
    return ok(result, formatSyncMessage(result.addedCount));
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}

function formatSyncMessage(addedCount: number) {
  return addedCount > 0
    ? zhCN.admin.syncTodayTasksSuccess.replace("{count}", String(addedCount))
    : zhCN.admin.syncTodayTasksNoChange;
}
