import type { MasterEffect } from "./master-turn";

export type HazardTrigger =
  | "onEncounterStart"
  | "onMasterTurnStart"
  | "onMasterTurnEnd"
  | "onHeroTurnStart";

export interface HazardDefinition {
  id: string;
  name: string;
  description: string;
  trigger: HazardTrigger;
  duration: number | null;
  effectIds: string[];
  effects?: MasterEffect[];
  clearCost?: { resource: "gold" | "combat"; amount: number };
}

export type HazardRegistry = Record<string, HazardDefinition>;
