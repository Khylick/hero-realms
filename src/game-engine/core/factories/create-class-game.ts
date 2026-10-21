import type {
  CardDefinition,
  CardInstance,
} from "../types/card";

import type {
  CardId,
  GameMode,
} from "../types/common";

import type {
  GameState,
} from "../types/game-state";

import type {
  CreatedClassHero,
} from "./create-class-hero";

import {
  createGame,
} from "./create-game";

import {
  validateGameState,
} from "../rules/invariants";

export interface CreateClassGameOptions {
  id: string;
  mode: GameMode;
  heroes: CreatedClassHero[];

  cardDefinitions: Record<
    string,
    CardDefinition
  >;

  seed?: number;
}

export function createClassGame({
  id,
  mode,
  heroes,
  cardDefinitions,
  seed = 42,
}: CreateClassGameOptions): GameState {
  if (heroes.length === 0) {
    throw new Error(
      "Une partie doit contenir au moins un héros.",
    );
  }

  const players = heroes.map(
    (hero) => hero.player,
  );

  const game = createGame({
    id,
    mode,
    players,
    cardDefinitions,
    seed,
  });

  const cards: Record<CardId, CardInstance> = {};

  for (const hero of heroes) {
    for (const [cardId, card] of Object.entries(
      hero.cards,
    )) {
      if (cards[cardId]) {
        throw new Error(
          `Identifiant de carte dupliqué : ${cardId}`,
        );
      }

      cards[cardId] = structuredClone(card);
    }
  }

  game.cards = cards;

  const errors = validateGameState(game);

  if (errors.length > 0) {
    throw new Error(
      `État initial invalide : ${errors.join("; ")}`,
    );
  }

  return game;
}