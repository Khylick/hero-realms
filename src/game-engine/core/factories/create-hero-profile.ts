
import type {
  PlayerClass,
  PlayerId,
} from "../types/common";

import type {
  HeroProfile,
} from "../types/hero-profile";

export interface CreateHeroProfileOptions {
  id: PlayerId;
  name: string;
  characterClass: PlayerClass;
}

export function createHeroProfile({
  id,
  name,
  characterClass,
}: CreateHeroProfileOptions): HeroProfile {
  if (!id.trim()) {
    throw new Error(
      "L'identifiant du héros est obligatoire.",
    );
  }

  if (!name.trim()) {
    throw new Error(
      "Le nom du héros est obligatoire.",
    );
  }

  return {
    id,
    name: name.trim(),
    characterClass,

    experience: 0,
    level: 1,

    customization: {
      additionalCardIds: [],
      removedCardIds: [],
      selectedPowerIds: [],
    },
  };
}
