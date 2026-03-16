export const PET_3D_ROUTE = "/pet/3d";
export const PET_3D_PLACEHOLDER_MODEL = "/pet3d/pet.glb";
export const PET_3D_ACTIONS = ["Idle", "Pet", "Eat"] as const;

export type Pet3DAction = (typeof PET_3D_ACTIONS)[number];

export type Pet3DActivePet = {
  id: string;
  displayName: string;
  xp: number;
  species: {
    nameZh: string;
    modelGlbUrl?: string | null;
  };
  currentStage: {
    nameZh: string;
  };
  activeSkin?: {
    nameZh: string;
  } | null;
};

export function isPet3DEnabled() {
  return process.env.PET_3D_ENABLED === "true";
}

export function getPet3DModelSrc(_pet: Pet3DActivePet) {
  return _pet.species.modelGlbUrl || PET_3D_PLACEHOLDER_MODEL;
}

export function getPet3DActionLabel(action: Pet3DAction, labels: Record<Pet3DAction, string>) {
  return labels[action];
}
