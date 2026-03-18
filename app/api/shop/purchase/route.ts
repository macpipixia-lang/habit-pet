import { purchaseShopItem } from "@/lib/data";
import { shopPurchaseSchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST(request: Request) {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json();
    const parsed = shopPurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const result = await purchaseShopItem(user.id, parsed.data.itemId);
    revalidatePaths("/shop", "/today", "/pet", "/pokedex", "/history", "/backpack");
    return ok(result, result.redeemCode ? zhCN.feedback.itemPurchased : zhCN.feedback.makeupPurchased);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
