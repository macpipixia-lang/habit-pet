import { useYesterdayMakeupCard } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { fail, ok, requireUserApi, revalidatePaths, toErrorMessage } from "@/app/api/_utils";

export async function POST() {
  const { user, response } = await requireUserApi();

  if (response || !user) {
    return response;
  }

  try {
    const result = await useYesterdayMakeupCard(user.id);
    revalidatePaths("/today", "/pet", "/pet/3d", "/shop", "/history", "/backpack", "/dashboard");
    return ok(result, zhCN.feedback.makeupApplied);
  } catch (error) {
    return fail(toErrorMessage(error), 500);
  }
}
