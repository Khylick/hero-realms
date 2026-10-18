import type {
  CardId,
  GameMode,
  GamePhase,
  GameStatus,
  PlayerId,
} from "./common";

import type {
  CardDefinition,
  CardInstance,
} from "./card";

import type { PlayerState } from "./player";

import type {
  HazardState,
  MasterState,
  MinionState,
} from "./enemy";

import type { CampaignProgress } from "./campaign";

import type {
  EffectResolutionState,
} from "./resolution";

export interface MarketState {
    deck: CardId[];
    row: CardId[];
    sacrificed: CardId[];
}

export interface GameState {
    id: string;

    mode: GameMode;
    status: GameStatus;
    phase: GamePhase;

    turnNumber: number;
    activePlayerId: PlayerId;

    playerOrder: PlayerId[];

    players: Record<PlayerId, PlayerState>;

    cardDefinitions: Record<string, CardDefinition>;
    cards: Record<CardId, CardInstance>;

    market: MarketState;

    master: MasterState | null;

    minions: Record<string, MinionState>;
    hazards: Record<string, HazardState>;

    campaign: CampaignProgress | null;

    randomState: number;
    nextCardInstanceId: number;

    resolution: EffectResolutionState;
}