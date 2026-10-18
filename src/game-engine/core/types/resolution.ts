import type {
  CardId,
  PlayerId,
} from "./common";

import type { CardEffect } from "./effect";

export interface EffectContext {
  playerId: PlayerId;
  sourceCardId: CardId;
  abilityId: string;
}

export interface QueuedEffect {
  context: EffectContext;
  effect: CardEffect;
}

export interface PendingChoice {
  id: string;
  playerId: PlayerId;

  type: "selectCards";

  from: "hand" | "discard";
  action: "discard" | "sacrifice";

  amount: number;
  availableCardIds: CardId[];
}

export interface EffectResolutionState {
  queue: QueuedEffect[];
  pendingChoice: PendingChoice | null;
  nextChoiceId: number;
}