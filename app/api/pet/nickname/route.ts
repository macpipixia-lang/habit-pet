import { updatePetNickname } from "@/lib/data";
import { petNicknameSchema } from "@/lib/validation";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST(request: Request) {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const body = await request.json();
    const parsed = petNicknameSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? zhCN.feedback.invalidInput);
    }

    const pet = await updatePetNickname(user.id, parsed.data.userPetId, parsed.data.nickname || undefined);
    revalidatePaths("/pet", "/pet/3d", "/backpack", "/pokedex", "/dashboard");
    return ok(pet, zhCN.feedback.petNicknameUpdated);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
