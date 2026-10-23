import type {
  MasterRegistry,
} from "./master";

import type {
  MinionRegistry,
} from "./minion";

import type {
  HazardRegistry,
} from "./hazard";

import type {
  EncounterRegistry,
} from "./encounter-definition";

export interface CampaignContent {
  masters: MasterRegistry;
  minions: MinionRegistry;
  hazards: HazardRegistry;
  encounters: EncounterRegistry;
}