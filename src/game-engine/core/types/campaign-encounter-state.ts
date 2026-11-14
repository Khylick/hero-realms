import type { EncounterProgress } from "./encounter";

import type {
  CampaignMasterState,
  CampaignMinionState,
  CampaignHazardState,
} from "./campaign-entities";

import type { CampaignContent } from "./campaign-content";
import type { MasterChoice, MasterStep } from "./master-turn";

export interface CampaignEncounterState {
  content: CampaignContent;
  steps: MasterStep[];
  pendingChoice: MasterChoice | null;
  nextEntityId: number;
  nextChoiceId: number;
  revealedCardIds: string[];
  playerOrder: string[];
  progress: EncounterProgress;

  master: CampaignMasterState;

  minions: Record<string, CampaignMinionState>;

  hazards: Record<string, CampaignHazardState>;
}
