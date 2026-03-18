import { adminShopItemSchema } from "@/lib/validation";
import { saveShopItem } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = adminShopItemSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const item = await saveShopItem(parsed.data);
    revalidateAdminPaths("/admin", "/admin/items", "/shop");
    return ok(item, zhCN.feedback.itemSaved);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
