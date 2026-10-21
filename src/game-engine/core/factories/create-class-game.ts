
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
  CharacterPowerRegistry,
} from "../types/character-power";

import type {
  ClassProgressionRegistry,
} from "../types/character-progression";

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

  cardDefinitions: Record<string, CardDefinition>;

  powerDefinitions?: CharacterPowerRegistry;

  classProgressions?: ClassProgressionRegistry;

  seed?: number;
}

export function createClassGame({
  id,
  mode,
  heroes,
  cardDefinitions,
  powerDefinitions = {},
  classProgressions = {},
  seed = 42,
}: CreateClassGameOptions): GameState {
  // 1. Vérifier la présence d'au moins un héros.
  if (heroes.length === 0) {
    throw new Error(
      "Une partie doit contenir au moins un héros.",
    );
  }

  // 2. Récupérer les personnages.
  const players = heroes.map(
    (hero) => structuredClone(hero.player),
  );

  // 3. Créer l'état initial de la partie.
  const game = createGame({
    id,
    mode,
    players,
    cardDefinitions,
    powerDefinitions,
    classProgressions,
    seed,
  });

  // 4. Regrouper toutes les instances de cartes.
  const cards: Record<CardId, CardInstance> = {};

  for (const hero of heroes) {
    for (const [cardId, card] of Object.entries(
      hero.cards,
    )) {
      if (Object.hasOwn(cards, cardId)) {
        throw new Error(
          `Identifiant de carte dupliqué : ${cardId}`,
        );
      }

      cards[cardId] = structuredClone(card);
    }
  }

  // 5. Enregistrer les cartes dans la partie.
  game.cards = cards;

  // 6. Vérifier la cohérence de l'état initial.
  const errors = validateGameState(game);

  if (errors.length > 0) {
    throw new Error(
      `État initial invalide : ${errors.join("; ")}`,
    );
  }

  return game;
}
