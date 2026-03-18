import { grantStarterPet } from "@/lib/data";
import { starterPetGrantSchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST(request: Request) {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json();
    const parsed = starterPetGrantSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const result = await grantStarterPet(user.id, parsed.data.speciesId);
    revalidatePaths("/onboarding/pet-egg", "/pet", "/today", "/shop", "/backpack", "/pokedex", "/history");
    return ok(result, result.status === "already-has-pet" ? zhCN.feedback.starterPetExists : zhCN.feedback.starterPetGranted);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
