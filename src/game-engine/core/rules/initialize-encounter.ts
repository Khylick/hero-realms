import type {
  GameState,
} from "../types/game-state";

import type {
  CampaignContent,
} from "../types/campaign-content";

import {
  createEncounter,
} from "../factories/create-encounter";

export interface InitializeEncounterOptions {
  encounterId: string;
  content: CampaignContent;
}

export function initializeEncounter(
  game: GameState,
  {
    encounterId,
    content,
  }: InitializeEncounterOptions,
): GameState {
  if (game.status !== "setup") {
    throw new Error(
      "Une rencontre ne peut être initialisée que pendant la préparation.",
    );
  }

  if (game.campaignEncounter !== null) {
    throw new Error(
      "Une rencontre est déjà initialisée.",
    );
  }

  const encounter = createEncounter({
    encounterId,
    content,
  });

  const next = structuredClone(game);

  next.campaignEncounter = encounter;

  return next;
}