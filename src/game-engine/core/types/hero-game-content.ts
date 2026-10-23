import type {
  CardDefinition,
} from "./card";

import type {
  ClassRegistry,
} from "./character-class";

import type {
  CharacterPowerRegistry,
} from "./character-power";

import type {
  ClassProgressionRegistry,
} from "./character-progression";

export interface HeroGameContent {
  cardDefinitions: Record<string, CardDefinition>;

  classDefinitions: ClassRegistry;

  powerDefinitions: CharacterPowerRegistry;

  classProgressions: ClassProgressionRegistry;
}
