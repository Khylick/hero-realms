import type {
  CardDefinitionId,
  PlayerClass,
} from "./common";

export interface ClassStartingStats {
  maxHealth: number;
  startingLevel: number;
  startingExperience: number;
}

export interface ClassDefinition {
  id: PlayerClass;
  name: string;
  description: string;

  startingStats: ClassStartingStats;

  // Identifiants de définitions de cartes,
  // et non d'instances de cartes.
  startingDeck: CardDefinitionId[];

  // Identifiants de compétences propres à la classe.
  // Leur fonctionnement sera développé en 7.3.
  startingSkillIds: string[];

  // Identifiants de capacités propres à la classe.
  startingAbilityIds: string[];
}

export type ClassRegistry = Record<
  PlayerClass,
  ClassDefinition
>;
