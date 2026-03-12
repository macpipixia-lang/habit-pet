import type { PetSkin, PetSpecies, PetStage, UserPet } from "@prisma/client";

export type PetSpeciesWithStages = PetSpecies & {
  stages: PetStage[];
};

export type OwnedPetRecord = UserPet & {
  species: PetSpeciesWithStages;
};

export type PetSkinRecord = PetSkin & {
  species?: PetSpecies | null;
};

export function getCurrentPetStage(stages: PetStage[], xp: number) {
  return [...stages]
    .sort((left, right) => left.minXp - right.minXp)
    .reduce((current, stage) => (xp >= stage.minXp ? stage : current), stages[0]);
}

export function getNextPetStage(stages: PetStage[], xp: number) {
  return [...stages]
    .sort((left, right) => left.minXp - right.minXp)
    .find((stage) => stage.minXp > xp);
}

export function getPetProgress(stages: PetStage[], xp: number) {
  const currentStage = getCurrentPetStage(stages, xp);
  const nextStage = getNextPetStage(stages, xp);
  const baseXp = currentStage?.minXp ?? 0;
  const targetXp = nextStage?.minXp ?? baseXp;
  const span = Math.max(1, targetXp - baseXp);
  const current = nextStage ? Math.max(0, xp - baseXp) : span;
  const percent = nextStage ? Math.min(100, Math.round((current / span) * 100)) : 100;

  return {
    currentStage,
    nextStage,
    current,
    total: span,
    percent,
    remainingXp: nextStage ? Math.max(0, nextStage.minXp - xp) : 0,
  };
}

const PET_VISUALS: Record<string, { emoji: string; className: string; accent: string }> = {
  "moss-fox-0": {
    emoji: "🥚",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,rgba(187,247,208,0.95),rgba(34,197,94,0.55))]",
    accent: "from-emerald-200/30 via-green-300/10 to-transparent",
  },
  "moss-fox-1": {
    emoji: "🦊",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(110,231,183,0.95),rgba(21,128,61,0.6))]",
    accent: "from-emerald-300/30 via-lime-300/10 to-transparent",
  },
  "moss-fox-2": {
    emoji: "🌿",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(74,222,128,0.98),rgba(21,94,117,0.72))]",
    accent: "from-green-300/35 via-teal-300/10 to-transparent",
  },
  "moss-fox-spring-scarf": {
    emoji: "🧣",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(167,243,208,0.98),rgba(34,197,94,0.6))]",
    accent: "from-lime-200/35 via-emerald-300/10 to-transparent",
  },
  "sun-seal-0": {
    emoji: "🥚",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,rgba(254,240,138,0.95),rgba(251,191,36,0.6))]",
    accent: "from-amber-200/30 via-yellow-200/10 to-transparent",
  },
  "sun-seal-1": {
    emoji: "🦭",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(253,224,71,0.95),rgba(251,146,60,0.62))]",
    accent: "from-yellow-200/30 via-orange-200/10 to-transparent",
  },
  "sun-seal-2": {
    emoji: "🌞",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(251,191,36,0.98),rgba(14,165,233,0.6))]",
    accent: "from-amber-300/35 via-sky-300/10 to-transparent",
  },
  "sun-seal-wave-float": {
    emoji: "🛟",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.26),transparent_28%),linear-gradient(135deg,rgba(125,211,252,0.96),rgba(251,191,36,0.65))]",
    accent: "from-sky-200/35 via-cyan-300/10 to-transparent",
  },
  "plum-owl-0": {
    emoji: "🥚",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,rgba(244,114,182,0.9),rgba(190,24,93,0.45))]",
    accent: "from-rose-200/30 via-pink-200/10 to-transparent",
  },
  "plum-owl-1": {
    emoji: "🦉",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(244,114,182,0.95),rgba(124,58,237,0.55))]",
    accent: "from-pink-300/30 via-fuchsia-300/10 to-transparent",
  },
  "plum-owl-2": {
    emoji: "🌙",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(192,132,252,0.95),rgba(30,41,59,0.85))]",
    accent: "from-fuchsia-300/35 via-slate-300/10 to-transparent",
  },
  "plum-owl-night-cape": {
    emoji: "🎐",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(216,180,254,0.96),rgba(51,65,85,0.88))]",
    accent: "from-violet-300/35 via-slate-400/10 to-transparent",
  },
};

export function getPetVisual(imageKey: string) {
  return (
    PET_VISUALS[imageKey] ?? {
      emoji: "✨",
      className:
        "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(125,211,252,0.8),rgba(15,23,42,0.9))]",
      accent: "from-sky-300/30 via-cyan-300/10 to-transparent",
    }
  );
}

export function getPetImageKey(stageImageKey: string, activeSkin?: Pick<PetSkin, "imageKey"> | null) {
  return activeSkin?.imageKey ?? stageImageKey;
}
