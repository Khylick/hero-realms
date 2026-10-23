import type {
  GameMode,
} from "../types/common";

import type {
  GameState,
} from "../types/game-state";

import type {
  HeroProfile,
} from "../types/hero-profile";

import type {
  HeroGameContent,
} from "../types/hero-game-content";

import { 
  createSeededRandom 
} from "../utils/random";

import {
  prepareHeroForEncounter,
} from "./prepare-hero-for-encounter";

import {
  createClassGame,
} from "./create-class-game";

import {
  validateHeroGameContent,
} from "../rules/validate-hero-game-content";

export interface CreateHeroGameOptions {
  id: string;

  mode: GameMode;

  profiles: HeroProfile[];

  content: HeroGameContent;

  seed?: number;
}

export function createHeroGame({
  id,
  mode,
  profiles,
  content,
  seed = 42,
}: CreateHeroGameOptions): GameState {
  // 1. Vérifier les paramètres généraux.
  if (!id.trim()) {
    throw new Error(
      "L'identifiant de partie est obligatoire.",
    );
  }

  if (profiles.length === 0) {
    throw new Error(
      "Une partie doit contenir au moins un héros.",
    );
  }

  // 2. Vérifier l'unicité des héros.
  const profileIds = profiles.map(
    (profile) => profile.id,
  );

  if (
    new Set(profileIds).size !== profileIds.length
  ) {
    throw new Error(
      "Deux héros ne peuvent pas partager le même identifiant.",
    );
  }

  // 3. Valider le contenu du jeu.
  const contentErrors = validateHeroGameContent(
    content,
  );

  if (contentErrors.length > 0) {
    throw new Error(
      `Contenu de jeu invalide : ${contentErrors.join("; ")}`,
    );
  }

  // 4. Créer un générateur déterministe.
  const random = createSeededRandom(seed);

  // 5. Préparer chaque héros.
  const heroes = profiles.map((profile) => {
    const classDefinition =
      content.classDefinitions[profile.characterClass];

    const progression =
      content.classProgressions[profile.characterClass];

    if (!classDefinition || !progression) {
      throw new Error(
        `Classe ou progression introuvable : ${profile.characterClass}.`,
      );
    }

    return prepareHeroForEncounter({
      profile,
      classDefinition,
      progression,
      cardDefinitions: content.cardDefinitions,
      powerDefinitions: content.powerDefinitions,
      random,
    });
  });

  // 6. Assembler la partie.
  const game = createClassGame({
    id,
    mode,
    heroes,
    cardDefinitions: content.cardDefinitions,
    powerDefinitions: content.powerDefinitions,
    classProgressions: content.classProgressions,
    seed: random.getState(),
  });

  return game;
}
