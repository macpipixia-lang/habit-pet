import { TodayClient } from "@/app/today/today-client";
import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";
import { requireUser } from "@/lib/auth";
import { getDashboardState, getPetPageState } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { isPet3DEnabled, PET_3D_ROUTE } from "@/modules/pet3d/pet3d";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const [dashboardState, petState] = await Promise.all([
    getDashboardState(user.id),
    getPetPageState(user.id),
  ]);
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const pet3dEnabled = isPet3DEnabled();
  const successMessage =
    success === "makeup-used"
      ? zhCN.feedback.makeupApplied
      : success === "pet-unlocked"
        ? zhCN.feedback.petUnlocked
        : success === "starter-pet-granted"
          ? zhCN.feedback.starterPetGranted
          : success === "starter-pet-exists"
            ? zhCN.feedback.starterPetExists
            : null;

  const activePet = petState.activePet;

  return (
    <PetOnboardingGuard>
      <TodayClient
        initialTasks={dashboardState.tasks}
        lockedTasks={dashboardState.lockedTasks}
        initialProfile={{
          streak: dashboardState.user.profile!.streak,
          level: dashboardState.user.profile!.level,
          exp: dashboardState.user.profile!.exp,
          points: dashboardState.user.profile!.points,
        }}
        nextShopPrice={dashboardState.nextShopPrice}
        showMakeupPrompt={dashboardState.makeupPromptVisible}
        initialError={error}
        initialSuccess={successMessage}
        petSummary={
          activePet
            ? {
                name: activePet.displayName,
                speciesName: activePet.species.nameZh,
                stageName: activePet.currentStage.nameZh,
                xp: activePet.xp,
                progressPercent: activePet.progress.percent,
                coverImageUrl: activePet.currentStageCoverImageUrl,
                stageLabel: `${zhCN.pet.stageLabel} · ${activePet.currentStage.nameZh}`,
                skinName: activePet.activeSkin?.nameZh ?? zhCN.pet.skinDefault,
                mode3dHref: pet3dEnabled ? PET_3D_ROUTE : null,
              }
            : null
        }
      />
    </PetOnboardingGuard>
  );
}
