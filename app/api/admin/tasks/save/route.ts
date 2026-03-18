import { adminTaskDefinitionSchema } from "@/lib/validation";
import { saveTaskDefinition } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = adminTaskDefinitionSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const task = await saveTaskDefinition(parsed.data);
    revalidateAdminPaths("/admin", "/admin/tasks", "/today", "/dashboard");
    return ok(task, zhCN.feedback.taskSaved);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
