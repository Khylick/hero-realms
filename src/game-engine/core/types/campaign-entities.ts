import type { EnemyId } from "./common";

import type { HazardId } from "./encounter";

export interface CampaignMasterState {
  id: EnemyId;
  definitionId: string;

  health: number;
  maxHealth: number;

  defeated: boolean;
  level: 1 | 2;
  masteryCardIds: string[];
  combat: number;
  deck: string[];
  discard: string[];
}

export interface CampaignMinionState {
  id: EnemyId;
  definitionId: string;

  health: number;
  maxHealth: number;

  defeated: boolean;
  isGuard: boolean;
  zoneOwnerId: string;
  exhausted: boolean;
  sourceCardId: string | null;
}

export interface CampaignHazardState {
  id: HazardId;
  definitionId: string;

  remainingDuration: number | null;

  active: boolean;
  zoneOwnerId: string;
  sourceCardId: string | null;
}
