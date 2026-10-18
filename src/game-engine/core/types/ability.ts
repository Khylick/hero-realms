import type { CardEffect } from "./effect";

export type AbilityTrigger = 
  | "onPlay"
  | "ally"
  | "activated"
  | "onSacrifice";

export type AbilityCondition =
  | {
    type: "hasFactionInPlay";
    faction: string;
    minimum: number;
  }
  | {
    type: "healthBelow";
    amount: number;
  }
  | {
    type: "hasChampionInPlay";
    minimum: number;
  };

export interface CardAbility {
  id: string;

  trigger: AbilityTrigger;

  conditions?: AbilityCondition[];

  effects: CardEffect[];

  optional?: boolean;

  oncePerTurn?: boolean;
}