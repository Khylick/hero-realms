import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEncounter,
  createHeroGame,
  createHeroProfile,
  initializeEncounter,
  validateCampaignEncounter,
  validateGameState,
} from "../core";

import {
  demoHeroGameContent,
} from "../../game-content/demo-hero-game-content";

import {
  demoCampaignContent,
} from "../../game-content/campaigns/demo/demo-campaign-content";

const encounterId = "shadow-lord-encounter";

function createScenarioGame() {
  return createHeroGame({
    id: "campaign-game",
    mode: "solo",
    profiles: [
      createHeroProfile({
        id: "hero-1",
        name: "Arthas",
        characterClass: "fighter",
      }),
    ],
    content: demoHeroGameContent,
    seed: 42,
  });
}

describe("Campaign encounter", () => {
  it("crée une rencontre non commencée", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    expect(encounter.progress.id).toBe(
      encounterId,
    );

    expect(encounter.progress.status).toBe(
      "notStarted",
    );

    expect(encounter.progress.round).toBe(0);
  });

  it("instancie le maître avec ses PV", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    expect(encounter.master.definitionId).toBe(
      "shadow-lord",
    );

    expect(encounter.master.health).toBe(40);
    expect(encounter.master.maxHealth).toBe(40);
    expect(encounter.master.defeated).toBe(false);
  });

  it("instancie trois sbires", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    expect(
      encounter.progress.minionIds,
    ).toHaveLength(3);

    expect(
      Object.keys(encounter.minions),
    ).toHaveLength(3);
  });

  it("attribue des identifiants uniques aux sbires", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    const ids = encounter.progress.minionIds;

    expect(new Set(ids).size).toBe(3);
  });

  it("conserve les propriétés des différents sbires", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    const minions = Object.values(
      encounter.minions,
    );

    const skeletons = minions.filter(
      (minion) =>
        minion.definitionId === "skeleton-warrior",
    );

    const cultists = minions.filter(
      (minion) =>
        minion.definitionId === "dark-cultist",
    );

    expect(skeletons).toHaveLength(2);
    expect(cultists).toHaveLength(1);

    expect(
      skeletons.every(
        (minion) =>
          minion.health === 6 &&
          minion.isGuard,
      ),
    ).toBe(true);

    expect(cultists[0].health).toBe(4);
    expect(cultists[0].isGuard).toBe(false);
  });

  it("instancie les dangers", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    expect(
      encounter.progress.hazardIds,
    ).toHaveLength(1);

    const hazard = Object.values(
      encounter.hazards,
    )[0];

    expect(hazard.definitionId).toBe(
      "cursed-altar",
    );

    expect(hazard.remainingDuration).toBeNull();
    expect(hazard.active).toBe(true);
  });

  it("produit une rencontre déterministe", () => {
    const first = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    const second = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    expect(first).toEqual(second);
  });

  it("refuse une rencontre inexistante", () => {
    expect(() =>
      createEncounter({
        encounterId: "unknown-encounter",
        content: demoCampaignContent,
      }),
    ).toThrow(
      "Rencontre introuvable : unknown-encounter.",
    );
  });

  it("initialise une rencontre dans une partie", () => {
    const game = createScenarioGame();

    const initialized = initializeEncounter(
      game,
      {
        encounterId,
        content: demoCampaignContent,
      },
    );

    expect(
      initialized.campaignEncounter,
    ).not.toBeNull();

    expect(
      initialized.campaignEncounter?.progress.id,
    ).toBe(encounterId);

    expect(validateGameState(initialized)).toEqual([]);
  });

  it("ne modifie pas la partie initiale", () => {
    const game = createScenarioGame();
    const snapshot = structuredClone(game);

    initializeEncounter(game, {
      encounterId,
      content: demoCampaignContent,
    });

    expect(game).toEqual(snapshot);
  });

  it("refuse d'initialiser deux rencontres", () => {
    const game = createScenarioGame();

    const initialized = initializeEncounter(
      game,
      {
        encounterId,
        content: demoCampaignContent,
      },
    );

    expect(() =>
      initializeEncounter(initialized, {
        encounterId,
        content: demoCampaignContent,
      }),
    ).toThrow(
      "Une rencontre est déjà initialisée.",
    );
  });

  it("refuse une initialisation hors préparation", () => {
    const game = createScenarioGame();

    game.status = "playing";

    expect(() =>
      initializeEncounter(game, {
        encounterId,
        content: demoCampaignContent,
      }),
    ).toThrow(
      "Une rencontre ne peut être initialisée que pendant la préparation.",
    );
  });

  it("détecte des PV de maître invalides", () => {
    const encounter = createEncounter({
      encounterId,
      content: demoCampaignContent,
    });

    encounter.master.health = 100;

    expect(
      validateCampaignEncounter(encounter),
    ).toContain(
      "Les PV du maître sont invalides.",
    );
  });

  it("conserve un état global valide", () => {
    const game = createScenarioGame();

    const initialized = initializeEncounter(
      game,
      {
        encounterId,
        content: demoCampaignContent,
      },
    );

    expect(
      validateCampaignEncounter(
        initialized.campaignEncounter!,
      ),
    ).toEqual([]);

    expect(
      validateGameState(initialized),
    ).toEqual([]);
  });
});