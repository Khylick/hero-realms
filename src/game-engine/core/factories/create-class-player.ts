import type {
  PlayerId,
} from "../types/common";

import type {
  ClassDefinition,
} from "../types/character-class";

import type {
  PlayerState,
} from "../types/player";

import { createPlayer } from "./create-player";

import {
  validateClassDefinition,
} from "../rules/character-classes";

interface CreateClassPlayerOptions {
  id: PlayerId;
  name: string;
  classDefinition: ClassDefinition;
}

export function createClassPlayer({
  id,
  name,
  classDefinition,
}: CreateClassPlayerOptions): PlayerState {
  const errors =
    validateClassDefinition(classDefinition);

  if (errors.length > 0) {
    throw new Error(
      `Définition de classe invalide : ${errors.join("; ")}`,
    );
  }

  const stats = classDefinition.startingStats;

  const player = createPlayer({
    id,
    name,
    characterClass: classDefinition.id,
    maxHealth: stats.maxHealth,
  });

  return {
    ...player,
    level: stats.startingLevel,
    experience: stats.startingExperience,
  };
}
