import Link from "next/link";
import { ClientActionForm } from "@/components/client-action-form";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPetEggShopState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";

export default async function PetEggPage({
  searchParams: _searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const state = await getPetEggShopState(user.id);

  if (!state.item) {
    return <Card className="text-sm text-mist">{zhCN.shop.activeItemsEmpty}</Card>;
  }

  const item = state.item;

  return (
    <div className="space-y-6">
      <Card>
        <Pill className="text-accent">{zhCN.shop.kindPetEgg}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.shop.petEggTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.shop.petEggDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-sm text-mist">{zhCN.shop.yourPoints}</p>
            <p className="mt-2 text-2xl text-white">{state.profile.points}</p>
          </div>
          <div className="rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-sm text-mist">{zhCN.shop.currentPrice}</p>
            <p className="mt-2 text-2xl text-white">{item.currentPrice}</p>
          </div>
          <Link href="/pokedex" className="inline-flex items-center rounded-2xl border border-line px-5 py-3 text-sm text-white">
            {zhCN.shop.viewPokedex}
          </Link>
        </div>
        <p className="mt-4 text-sm text-mist">{zhCN.shop.petEggHint}</p>
      </Card>

      {state.availableSpecies.length === 0 ? (
        <Card className="text-sm text-mist">{zhCN.shop.petEggEmpty}</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {state.availableSpecies.map((species) => {
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
                  <div className="grid gap-3">
                    {species.stages.map((stage) => (
                      <div key={stage.id} className="rounded-2xl border border-line bg-black/20 p-4">
                        <p className="text-sm text-mist">
                          {formatText(zhCN.pokedex.stageLabel, { index: stage.stageIndex + 1 })}
                        </p>
                        <p className="mt-2 text-white">{stage.nameZh}</p>
                        <p className="mt-1 text-sm text-mist">XP {stage.minXp}+</p>
                      </div>
                    ))}
                  </div>
                  <ClientActionForm action="/api/shop/pet-egg/purchase" successMessage={zhCN.feedback.petUnlocked} redirectTo="/pet" className="mt-6" refreshOnSuccess={false}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="speciesId" value={species.id} />
                    <button className="w-full rounded-2xl bg-accent px-5 py-3 font-semibold text-slate-950">
                      {formatText(zhCN.shop.petEggConfirm, { points: item.currentPrice })}
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
