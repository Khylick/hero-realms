import type {
  ClassProgressionDefinition,
  LevelDefinition,
} from "../types/character-progression";

import type { GameState } from "../types/game-state";
import type { PlayerId } from "../types/common";

export function getLevelForExperience(
  progression: ClassProgressionDefinition,
  experience: number,
): LevelDefinition {
  if (
    !Number.isSafeInteger(experience) ||
    experience < 0
  ) {
    throw new Error(
      "L'expérience doit être un entier positif ou nul.",
    );
  }

  let currentLevel = progression.levels[0];

  for (const level of progression.levels) {
    if (experience >= level.requiredExperience) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

export function gainExperience(
  game: GameState,
  playerId: PlayerId,
  amount: number,
): GameState {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(
      "Le gain d'expérience doit être un entier positif ou nul.",
    );
  }

  const player = game.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  const progression =
    game.classProgressions[player.characterClass];

  if (!progression) {
    throw new Error(
      `Progression introuvable pour la classe ${player.characterClass}.`,
    );
  }

  const nextExperience = player.experience + amount;

  if (!Number.isSafeInteger(nextExperience)) {
    throw new Error("Dépassement de la valeur d'expérience.");
  }

  const nextLevel = getLevelForExperience(
    progression,
    nextExperience,
  );

  const next = structuredClone(game);
  const updatedPlayer = next.players[playerId];

  const previousLevel = updatedPlayer.level;

  updatedPlayer.experience = nextExperience;
  updatedPlayer.level = nextLevel.level;

  // Appliquer uniquement les niveaux nouvellement atteints.
  for (const level of progression.levels) {
    if (
      level.level <= previousLevel ||
      level.level > nextLevel.level
    ) {
      continue;
    }

    updatedPlayer.maxHealth += level.maxHealthBonus;

    // Convention provisoire :
    // le bonus augmente aussi les PV actuels.
    updatedPlayer.health = Math.min(
      updatedPlayer.maxHealth,
      updatedPlayer.health + level.maxHealthBonus,
    );

    for (const powerId of level.unlockedPowerIds) {
      if (
        !updatedPlayer.powers.availablePowerIds.includes(
          powerId,
        )
      ) {
        updatedPlayer.powers.availablePowerIds.push(
          powerId,
        );
      }
    }
  }

  return next;
}
