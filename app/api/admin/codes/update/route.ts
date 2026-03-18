import { adminCodeUpdateSchema } from "@/lib/validation";
import { updateRedeemCodeStatus } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = adminCodeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const code = await updateRedeemCodeStatus(parsed.data);
    revalidateAdminPaths("/admin", "/admin/codes", "/history");
    return ok(code, zhCN.feedback.codeUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
