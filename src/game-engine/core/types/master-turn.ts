import type { Faction } from "./common";
import type { HazardTrigger } from "./hazard";

export type MasterEffect =
  | {
      type: "gainCombat" | "damageHero" | "healMaster" | "discardHero";
      amount: number;
    }
  | { type: "summonMinion"; definitionId: string; elite?: boolean };

export interface MasterLevel {
  cardsPerTurn: number;
  masteryThreshold: number;
  favoredFaction: Faction;
  abilities: Record<Faction, MasterEffect[]>;
}

export interface MasterDeckCard {
  id: string;
  name: string;
  faction?: Faction;
  kind: "action" | "minion" | "hazard" | "mastery";
  definitionId?: string;
  elite?: boolean;
  effects?: MasterEffect[];
}

export type MasterStep =
  | { type: "effect"; effect: MasterEffect }
  | { type: "card"; cardId: string }
  | { type: "levelUp" }
  | { type: "minions"; zoneOwnerId: string }
  | { type: "attack" }
  | { type: "hazards"; trigger: HazardTrigger }
  | { type: "finish" };

export interface MasterChoice {
  id: string;
  kind: "minionOrder" | "attackTarget";
  message: string;
  availableIds: string[];
}
