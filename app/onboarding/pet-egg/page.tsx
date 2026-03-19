import { redirect } from "next/navigation";
import { ClientActionForm } from "@/components/client-action-form";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getStarterPetOnboardingState } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";

export default async function PetEggOnboardingPage({
  searchParams: _searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const state = await getStarterPetOnboardingState(user.id);

  if (state.hasPets) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <Card>
        <Pill className="text-accent">{zhCN.nav.onboarding}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.onboarding.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.onboarding.description}</p>
        <p className="mt-4 text-sm text-mist">{zhCN.onboarding.hint}</p>
      </Card>

      {state.species.length === 0 ? (
        <Card className="text-sm text-mist">{zhCN.onboarding.empty}</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {state.species.map((species) => {
            const preview = species.stages.find((stage) => stage.stageIndex === 1) ?? species.stages.find((stage) => stage.stageIndex === 0) ?? species.stages[0];
            const visual = getPetVisual(preview.imageKey);
            const previewImageUrl = preview.coverImageUrl ?? species.coverImageUrl;

            return (
              <Card key={species.id} className="overflow-hidden p-0">
                <div className={`border-b border-line bg-gradient-to-br ${visual.accent} px-6 py-6`}>
                  <Pill className="text-accentWarm">{species.rarity ?? zhCN.shop.petEggAvailable}</Pill>
                  <div
                    className={`mt-5 flex w-28 aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 shadow-glow ${visual.className}`}
                  >
                    {previewImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={previewImageUrl} alt={preview.nameZh} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl">{visual.emoji}</span>
                    )}
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-white">{species.nameZh}</h2>
                  <p className="mt-3 text-sm leading-7 text-mist">{species.descriptionZh}</p>
                </div>
                <div className="px-6 py-6">
                  <ClientActionForm action="/api/onboarding/pet/grant" successMessage={zhCN.feedback.starterPetGranted} redirectTo="/pet" refreshOnSuccess={false}>
                    <input type="hidden" name="speciesId" value={species.id} />
                    <button className="w-full rounded-2xl bg-accent px-5 py-3 font-semibold text-slate-950">
                      {zhCN.onboarding.chooseButton}
                    </button>
                  </ClientActionForm>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
