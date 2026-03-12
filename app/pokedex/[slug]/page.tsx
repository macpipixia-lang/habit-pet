import Link from "next/link";
import { notFound } from "next/navigation";
import { PokedexTimeline, StageHero, getRarityLabel } from "@/components/pokedex-ui";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPokedexSpeciesState } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";

export default async function PokedexSpeciesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const state = await getPokedexSpeciesState(user.id, slug);

  if (!state) {
    notFound();
  }

  const preview =
    state.owned && state.ownedPet
      ? state.species.stages.find((stage) => stage.id === state.ownedPet?.currentStage.id) ?? state.species.stages[state.species.stages.length - 1]
      : state.species.stages[state.species.stages.length - 1];

  return (
    <div className="space-y-6">
      <Card>
        <Link href="/pokedex" className="text-sm text-mist underline decoration-white/20 underline-offset-4">
          {zhCN.pokedex.detailBack}
        </Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <StageHero
            stage={preview}
            imageKey={state.ownedPet?.currentImageKey}
            title={state.owned ? zhCN.pokedex.currentStagePreview : zhCN.pokedex.finalStagePreview}
            subtitle={state.owned ? zhCN.pokedex.heroOwnedHint : zhCN.pokedex.heroUnownedHint}
            concealed={!state.owned}
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Pill className="text-accent">{zhCN.pokedex.badge}</Pill>
              <Pill>{getRarityLabel(state.species.rarity)}</Pill>
              <Pill className={state.owned ? "text-accent" : ""}>{state.owned ? zhCN.pokedex.owned : zhCN.pokedex.unowned}</Pill>
            </div>
            <h1 className="mt-5 text-4xl font-semibold text-white">
              {state.species.nameZh} · {zhCN.pokedex.detailTitleSuffix}
            </h1>
            <p className="mt-4 text-sm leading-7 text-mist">{state.species.descriptionZh}</p>
            <p className="mt-4 text-sm text-mist">
              {state.owned ? zhCN.pokedex.detailOwnedStatus : zhCN.pokedex.detailUnownedStatus}
            </p>

            {state.owned && state.ownedPet ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-mist">{zhCN.pokedex.yourPetXp}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(state.ownedPet.xp)}</p>
                </div>
                <div className="rounded-2xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-mist">{zhCN.pokedex.yourPetStage}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{state.ownedPet.currentStage.nameZh}</p>
                </div>
                <div className="rounded-2xl border border-line bg-black/20 p-4 sm:col-span-2">
                  <p className="text-sm text-mist">{zhCN.pet.skinLabel}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {state.ownedPet.activeSkin?.nameZh ?? zhCN.pet.skinDefault}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-line bg-black/20 p-5">
                <p className="text-sm leading-7 text-mist">{zhCN.pokedex.unownedHint}</p>
                <Link href="/shop/pet-egg" className="mt-4 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950">
                  {zhCN.pokedex.goToPetEggShop}
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Pill className="text-accentWarm">{zhCN.pokedex.timelineTitle}</Pill>
        <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.pokedex.timelineTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.pokedex.timelineDescription}</p>
        <div className="mt-6">
          <PokedexTimeline species={state.species} currentStageId={state.ownedPet?.currentStage.id ?? null} />
        </div>
      </Card>
    </div>
  );
}
