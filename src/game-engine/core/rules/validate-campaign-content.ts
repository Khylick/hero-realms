import type {
  CampaignContent,
} from "../types/campaign-content";

export function validateCampaignContent(
  content: CampaignContent,
): string[] {
  const errors: string[] = [];

  // 1. Vérifier les maîtres.
  for (const [id, master] of Object.entries(
    content.masters,
  )) {
    if (master.id !== id) {
      errors.push(
        `Identifiant de maître incohérent : ${id}.`,
      );
    }

    if (
      !Number.isSafeInteger(master.maxHealth) ||
      master.maxHealth <= 0
    ) {
      errors.push(
        `PV du maître invalides : ${id}.`,
      );
    }

    if (
      !Number.isSafeInteger(master.attack) ||
      master.attack < 0
    ) {
      errors.push(
        `Attaque du maître invalide : ${id}.`,
      );
    }
  }

  // 2. Vérifier les sbires.
  for (const [id, minion] of Object.entries(
    content.minions,
  )) {
    if (minion.id !== id) {
      errors.push(
        `Identifiant de sbire incohérent : ${id}.`,
      );
    }

    if (
      !Number.isSafeInteger(minion.maxHealth) ||
      minion.maxHealth <= 0
    ) {
      errors.push(
        `PV du sbire invalides : ${id}.`,
      );
    }

    if (
      !Number.isSafeInteger(minion.attack) ||
      minion.attack < 0
    ) {
      errors.push(
        `Attaque du sbire invalide : ${id}.`,
      );
    }
  }

  // 3. Vérifier les dangers.
  for (const [id, hazard] of Object.entries(
    content.hazards,
  )) {
    if (hazard.id !== id) {
      errors.push(
        `Identifiant de danger incohérent : ${id}.`,
      );
    }

    if (
      hazard.duration !== null &&
      (
        !Number.isSafeInteger(hazard.duration) ||
        hazard.duration <= 0
      )
    ) {
      errors.push(
        `Durée du danger invalide : ${id}.`,
      );
    }
  }

  // 4. Vérifier les rencontres.
  for (const [id, encounter] of Object.entries(
    content.encounters,
  )) {
    if (encounter.id !== id) {
      errors.push(
        `Identifiant de rencontre incohérent : ${id}.`,
      );
    }

    if (
      !content.masters[encounter.masterDefinitionId]
    ) {
      errors.push(
        `Maître inconnu dans la rencontre ${id}.`,
      );
    }

    for (const entry of encounter.minions) {
      if (!content.minions[entry.definitionId]) {
        errors.push(
          `Sbire inconnu : ${entry.definitionId}.`,
        );
      }

      if (
        !Number.isSafeInteger(entry.count) ||
        entry.count <= 0
      ) {
        errors.push(
          `Nombre de sbires invalide : ${entry.definitionId}.`,
        );
      }
    }

    for (const hazardId of encounter.hazardDefinitionIds) {
      if (!content.hazards[hazardId]) {
        errors.push(
          `Danger inconnu : ${hazardId}.`,
        );
      }
    }
  }

  return errors;
}
