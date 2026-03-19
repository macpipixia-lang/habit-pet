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
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.32),transparent_28%),linear-gradient(135deg,rgba(215,189,144,0.95),rgba(111,89,61,0.72))]",
    accent: "from-accent/16 via-accent/6 to-transparent",
  },
  "moss-fox-1": {
    emoji: "🦊",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(208,178,129,0.94),rgba(79,64,44,0.82))]",
    accent: "from-accent/18 via-accent/7 to-transparent",
  },
  "moss-fox-2": {
    emoji: "🌿",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(194,161,113,0.92),rgba(52,45,39,0.88))]",
    accent: "from-accent/14 via-accent/5 to-transparent",
  },
  "moss-fox-3": {
    emoji: "🦊",
    className:
      "bg-[radial-gradient(circle_at_28%_28%,rgba(255,255,255,0.26),transparent_30%),linear-gradient(135deg,rgba(180,149,104,0.9),rgba(35,31,28,0.92))]",
    accent: "from-accent/20 via-accent/8 to-transparent",
  },
  "moss-fox-spring-scarf": {
    emoji: "🧣",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(211,184,139,0.94),rgba(90,71,49,0.8))]",
    accent: "from-accent/18 via-accent/6 to-transparent",
  },
  "sun-seal-0": {
    emoji: "🥚",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.36),transparent_28%),linear-gradient(135deg,rgba(220,198,160,0.96),rgba(118,95,67,0.74))]",
    accent: "from-accent/18 via-accent/7 to-transparent",
  },
  "sun-seal-1": {
    emoji: "🦭",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(212,181,133,0.96),rgba(102,82,57,0.82))]",
    accent: "from-accent/20 via-accent/8 to-transparent",
  },
  "sun-seal-2": {
    emoji: "🌞",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(205,171,118,0.94),rgba(72,58,41,0.86))]",
    accent: "from-accent/16 via-accent/6 to-transparent",
  },
  "sun-seal-3": {
    emoji: "🌊",
    className:
      "bg-[radial-gradient(circle_at_32%_32%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,rgba(189,156,108,0.9),rgba(41,35,31,0.92))]",
    accent: "from-accent/18 via-accent/7 to-transparent",
  },
  "sun-seal-wave-float": {
    emoji: "🛟",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.26),transparent_28%),linear-gradient(135deg,rgba(217,191,150,0.95),rgba(114,91,63,0.78))]",
    accent: "from-accent/18 via-accent/7 to-transparent",
  },
  "plum-owl-0": {
    emoji: "🥚",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(135deg,rgba(208,187,155,0.94),rgba(94,79,64,0.82))]",
    accent: "from-accent/14 via-accent/5 to-transparent",
  },
  "plum-owl-1": {
    emoji: "🦉",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(195,169,131,0.94),rgba(59,50,42,0.88))]",
    accent: "from-accent/16 via-accent/6 to-transparent",
  },
  "plum-owl-2": {
    emoji: "🌙",
    className:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(177,151,113,0.9),rgba(29,27,25,0.94))]",
    accent: "from-accent/12 via-accent/4 to-transparent",
  },
  "plum-owl-3": {
    emoji: "🪶",
    className:
      "bg-[radial-gradient(circle_at_28%_28%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,rgba(165,142,107,0.88),rgba(24,23,22,0.96))]",
    accent: "from-accent/14 via-accent/5 to-transparent",
  },
  "plum-owl-night-cape": {
    emoji: "🎐",
    className:
      "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(186,162,127,0.9),rgba(35,32,29,0.94))]",
    accent: "from-accent/16 via-accent/5 to-transparent",
  },
};

export function getPetVisual(imageKey: string) {
  return (
    PET_VISUALS[imageKey] ?? {
      emoji: "✨",
      className:
        "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(201,164,106,0.82),rgba(38,35,32,0.92))]",
      accent: "from-accent/16 via-accent/6 to-transparent",
    }
  );
}

export function getPetImageKey(stageImageKey: string, activeSkin?: Pick<PetSkin, "imageKey"> | null) {
  return activeSkin?.imageKey ?? stageImageKey;
}
