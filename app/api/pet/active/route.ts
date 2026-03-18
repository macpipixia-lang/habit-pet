import { setActivePet } from "@/lib/data";
import { activePetSchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST(request: Request) {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json();
    const parsed = activePetSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const pet = await setActivePet(user.id, parsed.data.userPetId);
    revalidatePaths("/pet", "/pet/3d", "/backpack", "/today", "/dashboard");
    return ok(pet, zhCN.feedback.activePetUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
