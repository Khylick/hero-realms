import type {
  CardId,
  GameMode,
  GameFormat,
  GamePhase,
  GameStatus,
  PlayerId,
} from "./common";

import type { CardDefinition, CardInstance } from "./card";

import type { PlayerState } from "./player";

import type { CampaignProgress } from "./campaign";

import type { EffectResolutionState } from "./resolution";

import type { CharacterPowerRegistry } from "./character-power";

import type { ClassProgressionRegistry } from "./character-progression";

import type { CampaignEncounterState } from "./campaign-encounter-state";

export interface MarketState {
  deck: CardId[];
  row: CardId[];
  sacrificed: CardId[];
  fireGems: CardId[];
}

export interface GameState {
  id: string;

  mode: GameMode;
  format: GameFormat;
  log: string[];
  status: GameStatus;
  phase: GamePhase;

  turnNumber: number;
  activePlayerId: PlayerId;

  playerOrder: PlayerId[];

  players: Record<PlayerId, PlayerState>;

  cardDefinitions: Record<string, CardDefinition>;
  cards: Record<CardId, CardInstance>;

  market: MarketState;

  campaign: CampaignProgress | null;

  randomState: number;
  nextCardInstanceId: number;

  resolution: EffectResolutionState;

  powerDefinitions: CharacterPowerRegistry;

  classProgressions: ClassProgressionRegistry;

  campaignEncounter: CampaignEncounterState | null;
}
