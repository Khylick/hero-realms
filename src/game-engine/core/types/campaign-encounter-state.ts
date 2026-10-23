import type {
  EncounterProgress,
} from "./encounter";

import type {
  CampaignMasterState,
  CampaignMinionState,
  CampaignHazardState,
} from "./campaign-entities";

export interface CampaignEncounterState {
  progress: EncounterProgress;

  master: CampaignMasterState;

  minions: Record<
    string,
    CampaignMinionState
  >;

  hazards: Record<
    string,
    CampaignHazardState
  >;
}