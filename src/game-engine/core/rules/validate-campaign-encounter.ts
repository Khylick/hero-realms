import type {
  CampaignEncounterState,
} from "../types/campaign-encounter-state";

export function validateCampaignEncounter(
  encounter: CampaignEncounterState,
): string[] {
  const errors: string[] = [];

  const {
    progress,
    master,
    minions,
    hazards,
  } = encounter;

  if (progress.masterId !== master.id) {
    errors.push(
      "L'identifiant du maître est incohérent.",
    );
  }

  if (
    !Number.isSafeInteger(master.health) ||
    master.health < 0 ||
    master.health > master.maxHealth
  ) {
    errors.push(
      "Les PV du maître sont invalides.",
    );
  }

  if (master.defeated !== (master.health === 0)) {
    errors.push(
      "L'état de défaite du maître est incohérent.",
    );
  }

  for (const minionId of progress.minionIds) {
    const minion = minions[minionId];

    if (!minion) {
      errors.push(
        `Sbire introuvable : ${minionId}.`,
      );

      continue;
    }

    if (minion.id !== minionId) {
      errors.push(
        `Identifiant de sbire incohérent : ${minionId}.`,
      );
    }

    if (
      !Number.isSafeInteger(minion.health) ||
      minion.health < 0 ||
      minion.health > minion.maxHealth
    ) {
      errors.push(
        `PV du sbire invalides : ${minionId}.`,
      );
    }

    if (
      minion.defeated !== (minion.health === 0)
    ) {
      errors.push(
        `État de défaite incohérent : ${minionId}.`,
      );
    }
  }

  for (const hazardId of progress.hazardIds) {
    const hazard = hazards[hazardId];

    if (!hazard) {
      errors.push(
        `Danger introuvable : ${hazardId}.`,
      );

      continue;
    }

    if (hazard.id !== hazardId) {
      errors.push(
        `Identifiant de danger incohérent : ${hazardId}.`,
      );
    }

    if (
      hazard.remainingDuration !== null &&
      (
        !Number.isSafeInteger(hazard.remainingDuration) ||
        hazard.remainingDuration < 0
      )
    ) {
      errors.push(
        `Durée du danger invalide : ${hazardId}.`,
      );
    }
  }

  if (
    !Number.isSafeInteger(progress.round) ||
    progress.round < 0
  ) {
    errors.push(
      "Le numéro de round est invalide.",
    );
  }

  return errors;
}