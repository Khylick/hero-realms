import type {
  CardDefinition,
  CardInstance,
} from "../types/card";

import type {
  CardId,
  PlayerId,
} from "../types/common";

import type {
  ClassDefinition,
} from "../types/character-class";

import type {
  PlayerState,
} from "../types/player";

import type {
  RandomGenerator,
} from "../utils/random";

import {
  createClassPlayer,
} from "./create-class-player";

import {
  createStartingDeck,
} from "../rules/deck";

export interface CreateClassHeroOptions {
  id: PlayerId;
  name: string;
  classDefinition: ClassDefinition;

  cardDefinitions: Record<
    string,
    CardDefinition
  >;

  random: RandomGenerator;
}

export interface CreatedClassHero {
  player: PlayerState;
  cards: Record<CardId, CardInstance>;
}

export function createClassHero({
  id,
  name,
  classDefinition,
  cardDefinitions,
  random,
}: CreateClassHeroOptions): CreatedClassHero {
  // 1. Créer le personnage.
  const player = createClassPlayer({
    id,
    name,
    classDefinition,
  });

  // 2. Vérifier la composition du deck.
  if (classDefinition.startingDeck.length === 0) {
    throw new Error(
      `Le deck de départ de la classe ${classDefinition.id} est vide.`,
    );
  }

  for (const definitionId of classDefinition.startingDeck) {
    if (!cardDefinitions[definitionId]) {
      throw new Error(
        `Carte inconnue dans le deck de départ : ${definitionId}`,
      );
    }
  }

  // 3. Générer les instances et mélanger le deck.
  const result = createStartingDeck(
    player,
    classDefinition.startingDeck,
    random,
  );

  return {
    player: result.player,
    cards: result.cards,
  };
}