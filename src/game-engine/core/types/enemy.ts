
import type {
  CardId,
  EnemyId,
  PlayerId,
} from "./common";

export interface MasterState {
  id: EnemyId;
  name: string;

  health: number;
  maxHealth: number;

  mastery: number;

  deck: CardId[];
  discard: CardId[];

  defeated: boolean;
}

export interface MinionState {
  id: EnemyId;
  name: string;

  defense: number;
  currentDefense: number;

  zoneOwnerId: PlayerId;

  isGuard: boolean;
  exhausted: boolean;
}

export interface HazardState {
  id: EnemyId;
  name: string;

  zoneOwnerId: PlayerId;

  resolved: boolean;
}
