
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyAction,
  canTargetCampaignMaster,
  canTargetCampaignMinion,
  createHeroGame,
  createHeroProfile,
  initializeEncounter,
  startCampaignEncounter,
  validateGameState,
  type GameState,
} from "../core";

import {
  demoHeroGameContent,
} from "../../game-content/demo-hero-game-content";

import {
  demoCampaignContent,
} from "../../game-content/campaigns/demo/demo-campaign-content";

const encounterId = "shadow-lord-encounter";

function createCombatScenario(): GameState {
  const game = createHeroGame({
    id: "campaign-combat-test",
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

  const initialized = initializeEncounter(game, {
    encounterId,
    content: demoCampaignContent,
  });

  initialized.status = "playing";
  initialized.phase = "main";

  initialized.players["hero-1"].resources.combat = 20;

  return startCampaignEncounter(initialized);
}

describe("Campaign combat", () => {
  it("commence une rencontre", () => {
    const game = createCombatScenario();

    expect(
      game.campaignEncounter?.progress.status,
    ).toBe("inProgress");

    expect(
      game.campaignEncounter?.progress.round,
    ).toBe(1);
  });

  it("empêche de cibler le maître tant qu'un garde existe", () => {
    const game = createCombatScenario();

    expect(
      canTargetCampaignMaster(
        game.campaignEncounter!,
      ),
    ).toBe(false);
  });

  it("permet de cibler un sbire garde", () => {
    const game = createCombatScenario();

    const guardId =
      game.campaignEncounter!.progress.minionIds[0];

    expect(
      canTargetCampaignMinion(
        game.campaignEncounter!,
        guardId,
      ),
    ).toBe(true);
  });

  it("empêche de cibler un sbire non garde", () => {
    const game = createCombatScenario();

    const cultistId =
      game.campaignEncounter!.progress.minionIds[2];

    expect(
      canTargetCampaignMinion(
        game.campaignEncounter!,
        cultistId,
      ),
    ).toBe(false);
  });

  it("inflige des dégâts à un sbire", () => {
    const game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    const next = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId,
      combat: 3,
    });

    expect(
      next.campaignEncounter!.minions[minionId].health,
    ).toBe(3);

    expect(
      next.players["hero-1"].resources.combat,
    ).toBe(17);
  });

  it("élimine un sbire lorsque ses PV atteignent zéro", () => {
    const game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    const next = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId,
      combat: 6,
    });

    expect(
      next.campaignEncounter!.minions[minionId].health,
    ).toBe(0);

    expect(
      next.campaignEncounter!.minions[minionId].defeated,
    ).toBe(true);
  });

  it("ne produit pas de PV négatifs", () => {
    const game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    const next = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId,
      combat: 10,
    });

    expect(
      next.campaignEncounter!.minions[minionId].health,
    ).toBe(0);

    expect(
      next.players["hero-1"].resources.combat,
    ).toBe(10);
  });

  it("refuse une attaque sans assez de combat", () => {
    const game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CAMPAIGN_MINION",
        playerId: "hero-1",
        minionId,
        combat: 100,
      }),
    ).toThrow(
      "Le héros ne possède pas assez de combat.",
    );
  });

  it("refuse une dépense de combat négative", () => {
    const game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CAMPAIGN_MINION",
        playerId: "hero-1",
        minionId,
        combat: -1,
      }),
    ).toThrow(
      "Le combat dépensé doit être un entier strictement positif.",
    );
  });

  it("refuse une attaque sur un sbire inconnu", () => {
    const game = createCombatScenario();

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CAMPAIGN_MINION",
        playerId: "hero-1",
        minionId: "unknown-minion",
        combat: 1,
      }),
    ).toThrow(
      "Sbire introuvable : unknown-minion.",
    );
  });

  it("refuse d'attaquer un sbire déjà vaincu", () => {
    let game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    game = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId,
      combat: 6,
    });

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CAMPAIGN_MINION",
        playerId: "hero-1",
        minionId,
        combat: 1,
      }),
    ).toThrow(
      "Ce sbire ne peut pas être ciblé.",
    );
  });

  it("permet d'attaquer le maître après élimination des gardes", () => {
    let game = createCombatScenario();

    const [firstGuard, secondGuard] =
      game.campaignEncounter!.progress.minionIds;

    game = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId: firstGuard,
      combat: 6,
    });

    game = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId: secondGuard,
      combat: 6,
    });

    expect(
      canTargetCampaignMaster(
        game.campaignEncounter!,
      ),
    ).toBe(true);

    game = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MASTER",
      playerId: "hero-1",
      combat: 5,
    });

    expect(
      game.campaignEncounter!.master.health,
    ).toBe(35);

    expect(
      game.players["hero-1"].resources.combat,
    ).toBe(3);
  });

  it("refuse d'attaquer le maître protégé", () => {
    const game = createCombatScenario();

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CAMPAIGN_MASTER",
        playerId: "hero-1",
        combat: 5,
      }),
    ).toThrow(
      "Le maître ne peut pas être ciblé.",
    );
  });

  it("ne modifie pas l'état initial", () => {
    const game = createCombatScenario();

    const snapshot = structuredClone(game);

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId,
      combat: 3,
    });

    expect(game).toEqual(snapshot);
  });

  it("préserve les invariants après une attaque", () => {
    const game = createCombatScenario();

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    const next = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero-1",
      minionId,
      combat: 6,
    });

    expect(validateGameState(next)).toEqual([]);
  });

  it("refuse d'attaquer hors de la phase principale", () => {
    const game = createCombatScenario();

    game.phase = "draw";

    const minionId =
      game.campaignEncounter!.progress.minionIds[0];

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CAMPAIGN_MINION",
        playerId: "hero-1",
        minionId,
        combat: 2,
      }),
    ).toThrow(
      "Une attaque de campagne nécessite une partie en cours et la phase principale.",
    );
  });
});
