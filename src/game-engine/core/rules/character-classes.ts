import type {
  PlayerClass,
} from "../types/common";

import type {
  ClassDefinition,
  ClassRegistry,
} from "../types/character-class";

export const PLAYER_CLASSES: readonly PlayerClass[] = [
  "cleric",
  "fighter",
  "ranger",
  "thief",
  "wizard",
];

export function validateClassDefinition(
  definition: ClassDefinition,
): string[] {
  const errors: string[] = [];

  if (!PLAYER_CLASSES.includes(definition.id)) {
    errors.push("Identifiant de classe invalide.");
  }

  if (!definition.name.trim()) {
    errors.push("Le nom de la classe est obligatoire.");
  }

  const stats = definition.startingStats;

  if (
    !Number.isSafeInteger(stats.maxHealth) ||
    stats.maxHealth <= 0
  ) {
    errors.push(
      "Les points de vie initiaux doivent être positifs.",
    );
  }

  if (
    !Number.isSafeInteger(stats.startingLevel) ||
    stats.startingLevel < 1
  ) {
    errors.push(
      "Le niveau initial doit être supérieur ou égal à 1.",
    );
  }

  if (
    !Number.isSafeInteger(stats.startingExperience) ||
    stats.startingExperience < 0
  ) {
    errors.push(
      "L'expérience initiale ne peut pas être négative.",
    );
  }

  for (const [name, ids] of [
    ["startingDeck", definition.startingDeck],
    ["startingSkillIds", definition.startingSkillIds],
    ["startingAbilityIds", definition.startingAbilityIds],
  ] as const) {
    if (
      ids.some(
        (id) =>
          typeof id !== "string" ||
          id.trim().length === 0,
      )
    ) {
      errors.push(
        `Identifiant invalide dans ${name}.`,
      );
    }
  }

  return errors;
}

export function validateClassRegistry(
  registry: ClassRegistry,
): string[] {
  const errors: string[] = [];

  for (const classId of PLAYER_CLASSES) {
    const definition = registry[classId];

    if (!definition) {
      errors.push(
        `Définition manquante : ${classId}`,
      );
      continue;
    }

    if (definition.id !== classId) {
      errors.push(
        `Identifiant incohérent : ${classId}`,
      );
    }

    for (
      const error of validateClassDefinition(definition)
    ) {
      errors.push(`${classId} : ${error}`);
    }
  }

  return errors;
}
