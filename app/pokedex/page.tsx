import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPokedexState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";

export default async function PokedexPage() {
  const user = await requireUser();
  const state = await getPokedexState(user.id);

  if (state.species.length === 0) {
    return <Card className="text-sm text-mist">{zhCN.pokedex.empty}</Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <Pill className="text-accent">{zhCN.pokedex.badge}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.pokedex.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.pokedex.description}</p>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {state.species.map((species) => {
          const preview = species.stages[species.stages.length - 1] ?? species.stages[0];
          const visual = getPetVisual(preview.imageKey);

          return (
            <Card key={species.id} className="overflow-hidden p-0">
              <div className={`border-b border-line bg-gradient-to-br ${visual.accent} px-6 py-6`}>
                <div className="flex items-center justify-between gap-3">
                  <Pill className="text-accentWarm">{species.owned ? zhCN.pokedex.owned : zhCN.pokedex.unowned}</Pill>
                  {species.rarity ? <Pill>{species.rarity}</Pill> : null}
                </div>
                <div
                  className={`mt-5 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/10 text-5xl shadow-glow ${visual.className}`}
                >
                  {visual.emoji}
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">{species.nameZh}</h2>
                <p className="mt-3 text-sm leading-7 text-mist">{species.descriptionZh}</p>
              </div>
              <div className="grid gap-3 px-6 py-6">
                {species.stages.map((stage) => {
                  const stageVisual = getPetVisual(stage.imageKey);

                  return (
                    <div key={stage.id} className="rounded-2xl border border-line bg-black/20 p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 text-2xl ${stageVisual.className}`}
                        >
                          {stageVisual.emoji}
                        </div>
                        <div>
                          <p className="text-sm text-mist">{formatText(zhCN.pokedex.stageLabel, { index: stage.stageIndex + 1 })}</p>
                          <p className="mt-1 text-white">{stage.nameZh}</p>
                          <p className="mt-1 text-sm text-mist">XP {stage.minXp}+</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
