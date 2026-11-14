import type { CampaignContent } from "../types/campaign-content";
import type { MasterEffect } from "../types/master-turn";

export function validateCampaignContent(content: CampaignContent): string[] {
  const errors: string[] = [];

  function validateEffects(effects: MasterEffect[], source: string) {
    for (const effect of effects) {
      if (effect.type === "summonMinion") {
        if (!content.minions[effect.definitionId])
          errors.push(`Sbire inconnu dans ${source} : ${effect.definitionId}.`);
      } else if (
        !Number.isSafeInteger(effect.amount) ||
        effect.amount < (effect.type === "discardHero" ? 1 : 0)
      ) {
        errors.push(`Quantité d'effet invalide : ${source}.`);
      }
    }
  }

  // 1. Vérifier les maîtres.
  for (const [id, master] of Object.entries(content.masters)) {
    for (const level of master.levels ?? []) {
      if (
        !Number.isSafeInteger(level.cardsPerTurn) ||
        level.cardsPerTurn < 1 ||
        !Number.isSafeInteger(level.masteryThreshold) ||
        level.masteryThreshold < 1
      )
        errors.push(`Niveau du maître invalide : ${id}.`);
      for (const faction of ["imperial", "guild", "necros", "wild"] as const) {
        validateEffects(level.abilities[faction], `${id}.${faction}`);
      }
    }
    if (master.id !== id) {
      errors.push(`Identifiant de maître incohérent : ${id}.`);
    }

    if (!Number.isSafeInteger(master.maxHealth) || master.maxHealth <= 0) {
      errors.push(`PV du maître invalides : ${id}.`);
    }

    if (!Number.isSafeInteger(master.attack) || master.attack < 0) {
      errors.push(`Attaque du maître invalide : ${id}.`);
    }
  }

  // 2. Vérifier les sbires.
  for (const [id, minion] of Object.entries(content.minions)) {
    if (minion.id !== id) {
      errors.push(`Identifiant de sbire incohérent : ${id}.`);
    }

    if (!Number.isSafeInteger(minion.maxHealth) || minion.maxHealth <= 0) {
      errors.push(`PV du sbire invalides : ${id}.`);
    }

    if (!Number.isSafeInteger(minion.attack) || minion.attack < 0) {
      errors.push(`Attaque du sbire invalide : ${id}.`);
    }
  }

  // 3. Vérifier les dangers.
  for (const [id, hazard] of Object.entries(content.hazards)) {
    validateEffects(hazard.effects ?? [], id);
    if (
      hazard.clearCost &&
      (!Number.isSafeInteger(hazard.clearCost.amount) ||
        hazard.clearCost.amount < 0)
    ) {
      errors.push(`Coût de dissipation invalide : ${id}.`);
    }
    if (hazard.id !== id) {
      errors.push(`Identifiant de danger incohérent : ${id}.`);
    }

    if (
      hazard.duration !== null &&
      (!Number.isSafeInteger(hazard.duration) || hazard.duration <= 0)
    ) {
      errors.push(`Durée du danger invalide : ${id}.`);
    }
  }

  // 4. Vérifier les rencontres.
  for (const [id, card] of Object.entries(content.masterCards ?? {})) {
    if (card.id !== id)
      errors.push(`Identifiant de carte du Maître incohérent : ${id}.`);
    if (
      card.kind === "minion" &&
      (!card.definitionId || !content.minions[card.definitionId])
    )
      errors.push(`Sbire de carte inconnu : ${id}.`);
    if (
      card.kind === "hazard" &&
      (!card.definitionId || !content.hazards[card.definitionId])
    )
      errors.push(`Danger de carte inconnu : ${id}.`);
    validateEffects(card.effects ?? [], id);
  }
  for (const [id, encounter] of Object.entries(content.encounters)) {
    if (encounter.masterDeck) {
      for (const cardId of encounter.masterDeck) {
        if (!content.masterCards?.[cardId])
          errors.push(`Carte du Maître inconnue : ${cardId}.`);
      }
      if (
        encounter.masterDeck.filter(
          (cardId) => content.masterCards?.[cardId]?.kind === "mastery",
        ).length !== 5
      ) {
        errors.push(`Cinq maîtrises sont nécessaires : ${id}.`);
      }
    }
    if (encounter.id !== id) {
      errors.push(`Identifiant de rencontre incohérent : ${id}.`);
    }

    if (!content.masters[encounter.masterDefinitionId]) {
      errors.push(`Maître inconnu dans la rencontre ${id}.`);
    }

    for (const entry of encounter.minions) {
      if (!content.minions[entry.definitionId]) {
        errors.push(`Sbire inconnu : ${entry.definitionId}.`);
      }

      if (!Number.isSafeInteger(entry.count) || entry.count <= 0) {
        errors.push(`Nombre de sbires invalide : ${entry.definitionId}.`);
      }
    }

    for (const hazardId of encounter.hazardDefinitionIds) {
      if (!content.hazards[hazardId]) {
        errors.push(`Danger inconnu : ${hazardId}.`);
      }
    }
  }

  return errors;
}
