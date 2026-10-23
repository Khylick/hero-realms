import type {
  EncounterId,
  EnemyId,
} from "./common";

export type EnemyKind = "master" | "minion";

export type HazardId = string;

export type EncounterStatus =
  | "notStarted"
  | "inProgress"
  | "victory"
  | "defeat";

export interface EncounterProgress {
  id: EncounterId;
  status: EncounterStatus;

  masterId: EnemyId | null;
  minionIds: EnemyId[];
  hazardIds: HazardId[];

  round: number;
}