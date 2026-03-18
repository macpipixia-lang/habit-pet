import { adminPetSchema, adminPetStageAssetsSchema } from "@/lib/validation";
import { createPet, getAdminPetById, updatePet, updatePetStagesAssets } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as Record<string, unknown> & { stageAssets?: unknown };
    const parsed = adminPetSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const parsedStageAssets = adminPetStageAssetsSchema.safeParse(body.stageAssets ?? []);

    if (!parsedStageAssets.success) {
      return fail(parsedStageAssets.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const savedPet = parsed.data.id ? await updatePet(parsed.data) : await createPet(parsed.data);

    if (parsed.data.id && parsedStageAssets.data.length > 0) {
      await updatePetStagesAssets(parsed.data.id, parsedStageAssets.data);
    }

    const pet = await getAdminPetById(savedPet.id);

    revalidateAdminPaths(
      "/admin",
      "/admin/pets",
      `/admin/pets/${savedPet.id}`,
      "/shop/pet-egg",
      "/onboarding/pet-egg",
      "/pokedex",
      `/pokedex/${savedPet.slug}`,
      "/pet",
      "/dashboard",
      "/pet/3d",
    );

    return ok(pet ?? savedPet, zhCN.feedback.petSaved);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
