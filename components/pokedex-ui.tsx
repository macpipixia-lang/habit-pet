import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";
import { cn, formatNumber } from "@/lib/utils";

type SpeciesStage = {
  id: string;
  stageIndex: number;
  nameZh: string;
  minXp: number;
  imageKey: string;
  coverImageUrl?: string | null;
};

type OwnedPetSummary = {
  xp: number;
  currentStageId: string;
  currentImageKey?: string;
  currentStageCoverImageUrl: string;
};

type SpeciesSummary = {
  id: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  rarity: string | null;
  owned: boolean;
  stages: SpeciesStage[];
  previewCoverImageUrl: string;
  ownedPet?: OwnedPetSummary | null;
};

const RARITY_ORDER: Record<string, number> = {
  EPIC: 0,
  RARE: 1,
  COMMON: 2,
};

export function getRarityOrder(rarity: string | null) {
  return rarity ? (RARITY_ORDER[rarity] ?? 99) : 99;
}

export function getRarityLabel(rarity: string | null) {
  if (rarity === "EPIC") return zhCN.pokedex.rarityEpic;
  if (rarity === "RARE") return zhCN.pokedex.rarityRare;
  return zhCN.pokedex.rarityCommon;
}

function getRarityPillClass(rarity: string | null) {
  if (rarity === "EPIC") return "border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100";
  if (rarity === "RARE") return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
}

export function StageHero({
  stage,
  imageKey,
  coverImageUrl,
  title,
  subtitle,
  concealed = false,
  highlighted = false,
}: {
  stage: SpeciesStage;
  imageKey?: string;
  coverImageUrl?: string | null;
  title?: string;
  subtitle?: string;
  concealed?: boolean;
  highlighted?: boolean;
}) {
  const visual = getPetVisual(imageKey ?? stage.imageKey);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2rem] border bg-black/20",
        highlighted ? "border-accent/60 shadow-glow" : "border-line",
      )}
    >
      <div className={cn("border-b border-line bg-gradient-to-br px-6 py-6", visual.accent)}>
        {title ? <p className="text-sm text-mist">{title}</p> : null}
        <div
          className={cn(
            "mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-full border border-white/10 text-7xl shadow-glow transition",
            visual.className,
            concealed && "blur-md saturate-0",
          )}
        >
          {coverImageUrl ?? stage.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={coverImageUrl ?? stage.coverImageUrl ?? ""}
              alt={stage.nameZh}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            visual.emoji
          )}
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-white">{stage.nameZh}</p>
            <p className="mt-1 text-sm text-mist">XP {formatNumber(stage.minXp)}+</p>
          </div>
          {highlighted ? <Pill className="text-accent">{zhCN.pokedex.highlightCurrentStage}</Pill> : null}
        </div>
        {subtitle ? <p className="mt-3 text-sm leading-7 text-mist">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function PokedexSpeciesCard({ species }: { species: SpeciesSummary }) {
  const preview =
    species.owned && species.ownedPet
      ? species.stages.find((stage) => stage.id === species.ownedPet?.currentStageId) ?? species.stages[species.stages.length - 1]
      : species.stages[species.stages.length - 1];

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill className={getRarityPillClass(species.rarity)}>{getRarityLabel(species.rarity)}</Pill>
          <Pill className={species.owned ? "text-accent" : ""}>{species.owned ? zhCN.pokedex.owned : zhCN.pokedex.unowned}</Pill>
        </div>
        <div className="mt-5">
          <StageHero
            stage={preview}
            imageKey={species.ownedPet?.currentImageKey}
            coverImageUrl={species.previewCoverImageUrl}
            title={species.owned ? zhCN.pokedex.currentStagePreview : zhCN.pokedex.coverPreview}
            subtitle={species.owned ? zhCN.pokedex.heroOwnedHint : zhCN.pokedex.heroUnownedHint}
            concealed={!species.owned}
          />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">{species.nameZh}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{species.descriptionZh}</p>
      </div>
      <div className="px-6 py-6">
        <Link
          href={`/pokedex/${species.slug}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950"
        >
          {zhCN.pokedex.viewDetail}
        </Link>
      </div>
    </Card>
  );
}

export function PokedexTimeline({
  species,
  currentStageId,
}: {
  species: Pick<SpeciesSummary, "stages">;
  currentStageId?: string | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {species.stages.map((stage) => (
        <StageHero
          key={stage.id}
          stage={stage}
          coverImageUrl={stage.coverImageUrl}
          title={formatText(zhCN.pokedex.stageLabel, { index: stage.stageIndex + 1 })}
          highlighted={currentStageId === stage.id}
        />
      ))}
    </div>
  );
}
