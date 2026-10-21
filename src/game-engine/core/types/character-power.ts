import type { CardEffect } from "./effect";

export type CharacterPowerId = string;

export type CharacterPowerKind =
  | "skill"
  | "ability";

export type CharacterPowerUsage =
  | "oncePerTurn"
  | "oncePerEncounter";

export type CharacterPowerCost =
  | { type: "none" }
  | {
      type: "gold" | "combat";
      amount: number;
    };

export interface CharacterPowerDefinition {
  id: CharacterPowerId;
  name: string;
  description: string;

  kind: CharacterPowerKind;
  usage: CharacterPowerUsage;
  cost: CharacterPowerCost;

  effects: CardEffect[];
}

export type CharacterPowerRegistry = Record<
  CharacterPowerId,
  CharacterPowerDefinition
>;
