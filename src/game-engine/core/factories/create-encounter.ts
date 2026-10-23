import type {
  CampaignContent,
} from "../types/campaign-content";

import type {
  CampaignEncounterState,
} from "../types/campaign-encounter-state";

import type {
  CampaignMinionState,
  CampaignHazardState,
} from "../types/campaign-entities";

import {
  validateCampaignContent,
} from "../rules/validate-campaign-content";

export interface CreateEncounterOptions {
  encounterId: string;
  content: CampaignContent;
}

export function createEncounter({
  encounterId,
  content,
}: CreateEncounterOptions): CampaignEncounterState {
  const errors = validateCampaignContent(content);

  if (errors.length > 0) {
    throw new Error(
      `Contenu de campagne invalide : ${errors.join("; ")}`,
    );
  }

  const definition = content.encounters[encounterId];

  if (!definition) {
    throw new Error(
      `Rencontre introuvable : ${encounterId}.`,
    );
  }

  const masterDefinition =
    content.masters[definition.masterDefinitionId];

  const masterId = `${encounterId}:master`;

  const master = {
    id: masterId,
    definitionId: masterDefinition.id,

    health: masterDefinition.maxHealth,
    maxHealth: masterDefinition.maxHealth,

    defeated: false,
  };

  const minions: Record<
    string,
    CampaignMinionState
  > = {};

  let minionIndex = 0;

  for (const entry of definition.minions) {
    const minionDefinition =
      content.minions[entry.definitionId];

    for (let index = 0; index < entry.count; index++) {
      minionIndex++;

      const id = `${encounterId}:minion:${minionIndex}`;

      minions[id] = {
        id,
        definitionId: minionDefinition.id,

        health: minionDefinition.maxHealth,
        maxHealth: minionDefinition.maxHealth,

        defeated: false,
        isGuard: minionDefinition.isGuard,
      };
    }
  }

  const hazards: Record<
    string,
    CampaignHazardState
  > = {};

  definition.hazardDefinitionIds.forEach(
    (definitionId, index) => {
      const hazardDefinition =
        content.hazards[definitionId];

      const id = `${encounterId}:hazard:${index + 1}`;

      hazards[id] = {
        id,
        definitionId,

        remainingDuration:
          hazardDefinition.duration,

        active: true,
      };
    },
  );

  return {
    progress: {
      id: definition.id,
      status: "notStarted",

      masterId,
      minionIds: Object.keys(minions),
      hazardIds: Object.keys(hazards),

      round: 0,
    },

    master,
    minions,
    hazards,
  };
}