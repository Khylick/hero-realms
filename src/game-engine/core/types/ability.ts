import type { CardEffect } from "./effect";
import type { Faction } from "./common";

export type AbilityTrigger = 
  | "onPlay"
  | "ally"
  | "activated"
  | "onSacrifice";

export type AbilityCondition =
  | {
    type: "hasFactionInPlay";
    faction: Faction;
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