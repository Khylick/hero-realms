import type { PlayerClass } from "./common";

export interface LevelDefinition {
  level: number;

  // Expérience cumulée nécessaire
  // pour atteindre ce niveau.
  requiredExperience: number;

  // Augmentation des PV maximum
  // accordée en atteignant ce niveau.
  maxHealthBonus: number;

  // Pouvoirs débloqués à ce niveau.
  unlockedPowerIds: string[];
}

export interface ClassProgressionDefinition {
  characterClass: PlayerClass;
  levels: LevelDefinition[];
}

export type ClassProgressionRegistry = Partial<
  Record<PlayerClass, ClassProgressionDefinition>
>;
