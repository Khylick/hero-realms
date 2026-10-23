import type {
  EnemyId,
} from "./common";

import type {
  HazardId,
} from "./encounter";

export interface CampaignMasterState {
  id: EnemyId;
  definitionId: string;

  health: number;
  maxHealth: number;

  defeated: boolean;
}

export interface CampaignMinionState {
  id: EnemyId;
  definitionId: string;

  health: number;
  maxHealth: number;

  defeated: boolean;
  isGuard: boolean;
}

export interface CampaignHazardState {
  id: HazardId;
  definitionId: string;

  remainingDuration: number | null;

  active: boolean;
}