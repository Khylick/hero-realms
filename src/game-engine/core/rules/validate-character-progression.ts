import type {
  ClassProgressionDefinition,
} from "../types/character-progression";

export function validateClassProgression(
  progression: ClassProgressionDefinition,
): string[] {
  const errors: string[] = [];

  if (progression.levels.length === 0) {
    return ["La progression doit contenir au moins un niveau."];
  }

  let previousExperience = -1;

  for (const [index, level] of progression.levels.entries()) {
    const expectedLevel = index + 1;

    if (level.level !== expectedLevel) {
      errors.push(
        `Niveau attendu : ${expectedLevel}.`,
      );
    }

    if (
      !Number.isSafeInteger(level.requiredExperience) ||
      level.requiredExperience <= previousExperience
    ) {
      errors.push(
        `Seuil d'expérience invalide au niveau ${level.level}.`,
      );
    }

    if (
      !Number.isSafeInteger(level.maxHealthBonus) ||
      level.maxHealthBonus < 0
    ) {
      errors.push(
        `Bonus de PV invalide au niveau ${level.level}.`,
      );
    }

    previousExperience = level.requiredExperience;
  }

  if (progression.levels[0].requiredExperience !== 0) {
    errors.push(
      "Le niveau 1 doit commencer à 0 expérience.",
    );
  }

  return errors;
}
