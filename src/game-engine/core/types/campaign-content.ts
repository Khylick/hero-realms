import type { MasterRegistry } from "./master";

import type { MinionRegistry } from "./minion";

import type { HazardRegistry } from "./hazard";

import type { EncounterRegistry } from "./encounter-definition";

import type { MasterDeckCard } from "./master-turn";

export interface CampaignContent {
  masterCards?: Record<string, MasterDeckCard>;
  masters: MasterRegistry;
  minions: MinionRegistry;
  hazards: HazardRegistry;
  encounters: EncounterRegistry;
}
