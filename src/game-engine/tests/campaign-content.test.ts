import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateCampaignContent,
} from "../core";

import {
  demoCampaignContent,
} from "../../game-content/campaigns/demo/demo-campaign-content";

describe("Campaign content", () => {
  it("valide le contenu fictif", () => {
    expect(
      validateCampaignContent(demoCampaignContent),
    ).toEqual([]);
  });

  it("détecte un maître inconnu", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.encounters[
      "shadow-lord-encounter"
    ].masterDefinitionId = "unknown-master";

    expect(
      validateCampaignContent(content),
    ).toContain(
      "Maître inconnu dans la rencontre shadow-lord-encounter.",
    );
  });

  it("détecte un sbire inconnu", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.encounters[
      "shadow-lord-encounter"
    ].minions.push({
      definitionId: "unknown-minion",
      count: 1,
    });

    expect(
      validateCampaignContent(content),
    ).toContain(
      "Sbire inconnu : unknown-minion.",
    );
  });

  it("détecte un danger inconnu", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.encounters[
      "shadow-lord-encounter"
    ].hazardDefinitionIds.push(
      "unknown-hazard",
    );

    expect(
      validateCampaignContent(content),
    ).toContain(
      "Danger inconnu : unknown-hazard.",
    );
  });

  it("détecte un nombre de sbires invalide", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.encounters[
      "shadow-lord-encounter"
    ].minions[0].count = 0;

    expect(
      validateCampaignContent(content),
    ).toContain(
      "Nombre de sbires invalide : skeleton-warrior.",
    );
  });

  it("détecte des PV de maître invalides", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.masters["shadow-lord"].maxHealth = -1;

    expect(
      validateCampaignContent(content),
    ).toContain(
      "PV du maître invalides : shadow-lord.",
    );
  });

  it("détecte une attaque de sbire invalide", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.minions["dark-cultist"].attack = -2;

    expect(
      validateCampaignContent(content),
    ).toContain(
      "Attaque du sbire invalide : dark-cultist.",
    );
  });

  it("détecte une durée de danger invalide", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.hazards["cursed-altar"].duration = 0;

    expect(
      validateCampaignContent(content),
    ).toContain(
      "Durée du danger invalide : cursed-altar.",
    );
  });

  it("accepte un danger permanent", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    content.hazards["cursed-altar"].duration = null;

    expect(
      validateCampaignContent(content),
    ).toEqual([]);
  });

  it("ne modifie pas le contenu fourni", () => {
    const content = structuredClone(
      demoCampaignContent,
    );

    const snapshot = structuredClone(content);

    validateCampaignContent(content);

    expect(content).toEqual(snapshot);
  });
});