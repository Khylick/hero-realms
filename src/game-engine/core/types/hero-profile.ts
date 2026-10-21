
import type {
  CardDefinitionId,
  PlayerClass,
  PlayerId,
} from "./common";

import type {
  CharacterPowerId,
} from "./character-power";

export interface HeroCustomization {
  // Cartes ajoutées au deck de départ.
  additionalCardIds: CardDefinitionId[];

  // Cartes retirées du deck de départ.
  removedCardIds: CardDefinitionId[];

  // Pouvoirs supplémentaires sélectionnés.
  selectedPowerIds: CharacterPowerId[];
}

export interface HeroProfile {
  id: PlayerId;
  name: string;
  characterClass: PlayerClass;

  experience: number;
  level: number;

  customization: HeroCustomization;
}
