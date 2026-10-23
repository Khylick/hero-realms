import type {
  HeroGameContent,
} from "../types/hero-game-content";

import {
  validateClassRegistry,
} from "./character-classes";

import {
  validateCharacterPower,
} from "./validate-character-powers";

import {
  validateClassProgression,
} from "./validate-character-progression";

export function validateHeroGameContent(
  content: HeroGameContent,
): string[] {
  const errors: string[] = [];

  errors.push(
    ...validateClassRegistry(content.classDefinitions),
  );

  for (const [powerId, power] of Object.entries(
    content.powerDefinitions,
  )) {
    if (power.id !== powerId) {
      errors.push(
        `Identifiant de pouvoir incohérent : ${powerId}.`,
      );
    }

    errors.push(
      ...validateCharacterPower(power),
    );
  }

  for (const classDefinition of Object.values(
    content.classDefinitions,
  )) {
    // Vérifier les cartes de départ.
    for (const cardId of classDefinition.startingDeck) {
      if (!content.cardDefinitions[cardId]) {
        errors.push(
          `Carte de départ inconnue : ${cardId}.`,
        );
      }
    }

    // Vérifier les pouvoirs de départ.
    const startingPowerIds = [
      ...classDefinition.startingSkillIds,
      ...classDefinition.startingAbilityIds,
    ];

    for (const powerId of startingPowerIds) {
      if (!content.powerDefinitions[powerId]) {
        errors.push(
          `Pouvoir de départ inconnu : ${powerId}.`,
        );
      }
    }

    // Vérifier la progression de la classe.
    const progression =
      content.classProgressions[classDefinition.id];

    if (!progression) {
      errors.push(
        `Progression manquante : ${classDefinition.id}.`,
      );

      continue;
    }

    if (
      progression.characterClass !== classDefinition.id
    ) {
      errors.push(
        `Progression incohérente : ${classDefinition.id}.`,
      );
    }

    errors.push(
      ...validateClassProgression(progression),
    );

    // Vérifier les pouvoirs débloqués.
    for (const level of progression.levels) {
      for (const powerId of level.unlockedPowerIds) {
        if (!content.powerDefinitions[powerId]) {
          errors.push(
            `Pouvoir de progression inconnu : ${powerId}.`,
          );
        }
      }
    }
  }

  return errors;
}