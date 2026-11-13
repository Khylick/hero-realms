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

export interface QueuedOptionalAbility {
  type: "optionalAbility";
  context: EffectContext;
  effects: CardEffect[];
}

export type ResolutionStep =
  | QueuedEffect
  | QueuedOptionalAbility;

export type ChoiceCardZone =
  | "hand"
  | "discard"
  | "champions";

export type ChoiceCardAction =
  | "discard"
  | "sacrifice"
  | "stun";

export interface PendingCardChoice {
  id: string;
  playerId: PlayerId;

  type: "selectCards";

  from: ChoiceCardZone;
  action: ChoiceCardAction;

  amount: number;
  availableCardIds: CardId[];
}

export interface PendingOptionalAbilityChoice {
  id: string;
  playerId: PlayerId;
  type: "optionalAbility";
  context: EffectContext;
  effects: CardEffect[];
}

export type PendingChoice =
  | PendingCardChoice
  | PendingOptionalAbilityChoice;

export interface EffectResolutionState {
  queue: ResolutionStep[];
  pendingChoice: PendingChoice | null;
  nextChoiceId: number;
}