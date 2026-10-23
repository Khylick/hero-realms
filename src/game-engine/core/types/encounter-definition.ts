import type { EncounterId } from "./common";

export interface EncounterMinionEntry {
  definitionId: string;
  count: number;
}

export interface CampaignEncounterDefinition {
  id: EncounterId;
  name: string;
  description: string;

  masterDefinitionId: string;
  minions: EncounterMinionEntry[];
  hazardDefinitionIds: string[];
}

export type EncounterRegistry = Record<
  EncounterId,
  CampaignEncounterDefinition
>;