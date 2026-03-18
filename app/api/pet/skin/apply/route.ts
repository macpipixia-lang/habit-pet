import { applyPetSkin } from "@/lib/data";
import { petSkinApplySchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST(request: Request) {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json();
    const parsed = petSkinApplySchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const pet = await applyPetSkin(user.id, parsed.data.userPetId, parsed.data.skinId);
    revalidatePaths("/pet", "/backpack", "/pokedex", "/dashboard");
    return ok(pet, zhCN.feedback.petSkinUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
