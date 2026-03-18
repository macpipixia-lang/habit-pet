import { toggleShopItemActive } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as { itemId?: string };
    const itemId = body.itemId?.trim();

    if (!itemId) {
      return fail(zhCN.feedback.invalidInput);
    }

    const item = await toggleShopItemActive(itemId);
    revalidateAdminPaths("/admin", "/admin/items", "/shop");
    return ok(item, zhCN.feedback.itemStatusUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
