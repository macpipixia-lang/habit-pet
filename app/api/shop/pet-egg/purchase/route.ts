import { purchasePetEgg } from "@/lib/data";
import { petEggPurchaseSchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST(request: Request) {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json();
    const parsed = petEggPurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const result = await purchasePetEgg(user.id, parsed.data.itemId, parsed.data.speciesId);
    revalidatePaths("/shop", "/shop/pet-egg", "/pet", "/pokedex", "/history", "/backpack");
    return ok(result, zhCN.feedback.petUnlocked);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
