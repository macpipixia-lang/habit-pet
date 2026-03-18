import { z } from "zod";
import { updatePetStagesAssets } from "@/lib/data";
import { adminPetStageAssetsSchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireAdminApi, revalidateAdminPaths, toErrorMessage } from "@/app/api/admin/_utils";

const payloadSchema = z.object({
  petId: z.string().min(1, zhCN.feedback.invalidInput),
  stageAssets: adminPetStageAssetsSchema,
});

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    await updatePetStagesAssets(parsed.data.petId, parsed.data.stageAssets);
    revalidateAdminPaths(`/admin/pets/${parsed.data.petId}`, "/admin/pets", "/pet", "/dashboard", "/pet/3d", "/pokedex");
    return ok({ petId: parsed.data.petId, stageAssets: parsed.data.stageAssets }, zhCN.feedback.petSaved);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
