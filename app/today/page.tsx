import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";
import { TodayClient } from "@/app/today/today-client";
import { getDashboardState } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function TodayPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const state = await getDashboardState(user.id);
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;

  return (
    <PetOnboardingGuard>
      <TodayClient
        initialTasks={state.tasks}
        lockedTasks={state.lockedTasks}
        initialProfile={{
          streak: state.user.profile!.streak,
          level: state.user.profile!.level,
          exp: state.user.profile!.exp,
          points: state.user.profile!.points,
        }}
        nextShopPrice={state.nextShopPrice}
        showMakeupPrompt={state.makeupPromptVisible}
        initialError={error}
        initialSuccess={success === "makeup-used" ? zhCN.feedback.makeupApplied : null}
      />
    </PetOnboardingGuard>
  );
}
