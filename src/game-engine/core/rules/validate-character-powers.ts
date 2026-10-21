import type {
  CharacterPowerDefinition,
} from "../types/character-power";

export function validateCharacterPower(
  power: CharacterPowerDefinition,
): string[] {
  const errors: string[] = [];

  if (!power.id.trim()) {
    errors.push("Identifiant de pouvoir manquant.");
  }

  if (!power.name.trim()) {
    errors.push("Nom de pouvoir manquant.");
  }

  if (
    power.cost.type !== "none" &&
    (
      !Number.isSafeInteger(power.cost.amount) ||
      power.cost.amount < 0
    )
  ) {
    errors.push("Coût de pouvoir invalide.");
  }

  if (power.effects.length === 0) {
    errors.push("Un pouvoir doit avoir au moins un effet.");
  }

  return errors;
}
