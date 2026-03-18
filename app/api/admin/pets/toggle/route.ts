import { togglePetActive } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as { petId?: string };
    const petId = body.petId?.trim();

    if (!petId) {
      return fail(zhCN.feedback.invalidInput);
    }

    const pet = await togglePetActive(petId);
    revalidateAdminPaths("/admin", "/admin/pets", "/shop/pet-egg", "/onboarding/pet-egg", "/pokedex", "/dashboard", "/pet");
    return ok(pet, zhCN.feedback.petStatusUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
