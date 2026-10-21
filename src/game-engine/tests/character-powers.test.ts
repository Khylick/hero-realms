import { describe, expect, it } from "vitest";

import {
  applyAction,
  canUseCharacterPower,
  createClassGame,
  createClassHero,
  createSeededRandom,
  readyCharacterPowers,
  validateCharacterPower,
  type GameState,
} from "../core";

import {
  demoClasses,
} from "../../game-content/classes/demo-classes";

import {
  demoPowers,
} from "../../game-content/classes/demo-powers";

import {
  demoCards,
} from "../../game-content/cards/demo-cards";

function createPowerScenario(): GameState {
  const hero = createClassHero({
    id: "player-1",
    name: "Arthas",
    classDefinition: demoClasses.fighter,
    cardDefinitions: demoCards,
    random: createSeededRandom(42),
  });

  const game = createClassGame({
    id: "power-test",
    mode: "solo",
    heroes: [hero],
    cardDefinitions: demoCards,
    powerDefinitions: demoPowers,
    seed: 123,
  });

  game.status = "playing";
  game.phase = "main";

  return game;
}

describe("Character powers", () => {
  it("attribue les pouvoirs de la classe au héros", () => {
    const game = createPowerScenario();

    expect(
      game.players["player-1"].powers.availablePowerIds,
    ).toEqual([
      "fighter-battle-stance",
      "fighter-heroic-strike",
    ]);
  });

  it("active une compétence et applique ses effets", () => {
    let game = createPowerScenario();

    game = applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId: "fighter-battle-stance",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(2);

    expect(
      game.players["player-1"].powers.usedThisTurn,
    ).toContain("fighter-battle-stance");
  });

  it("empêche d'utiliser deux fois une compétence dans le même tour", () => {
    let game = createPowerScenario();

    game = applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId: "fighter-battle-stance",
    });

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-battle-stance",
      ),
    ).toBe(false);

    expect(() =>
      applyAction(game, {
        type: "USE_CHARACTER_POWER",
        playerId: "player-1",
        powerId: "fighter-battle-stance",
      }),
    ).toThrow("Ce pouvoir ne peut pas être utilisé.");
  });

  it("limite une capacité à une utilisation par rencontre", () => {
    let game = createPowerScenario();

    game = applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId: "fighter-heroic-strike",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(8);

    expect(
      game.players["player-1"].powers.usedThisEncounter,
    ).toContain("fighter-heroic-strike");

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-heroic-strike",
      ),
    ).toBe(false);
  });

  it("ne réinitialise pas une capacité de rencontre au changement de tour", () => {
    let game = createPowerScenario();

    game = applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId: "fighter-heroic-strike",
    });

    game = readyCharacterPowers(game, "player-1");

    expect(
      game.players["player-1"].powers.usedThisEncounter,
    ).toContain("fighter-heroic-strike");
  });

  it("prépare les compétences au début d'un nouveau tour", () => {
    let game = createPowerScenario();

    game = applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId: "fighter-battle-stance",
    });

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-battle-stance",
      ),
    ).toBe(false);

    game = readyCharacterPowers(game, "player-1");

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-battle-stance",
      ),
    ).toBe(true);
  });

  it("refuse un pouvoir inconnu", () => {
    const game = createPowerScenario();

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "unknown-power",
      ),
    ).toBe(false);
  });

  it("refuse un pouvoir appartenant à une autre classe", () => {
    const game = createPowerScenario();

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "wizard-arcane-focus",
      ),
    ).toBe(false);
  });

  it("vérifie et déduit le coût d'un pouvoir", () => {
    let game = createPowerScenario();

    game.powerDefinitions["fighter-battle-stance"] = {
      ...game.powerDefinitions["fighter-battle-stance"],
      cost: {
        type: "gold",
        amount: 2,
      },
    };

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-battle-stance",
      ),
    ).toBe(false);

    game.players["player-1"].resources.gold = 3;

    game = applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId: "fighter-battle-stance",
    });

    expect(
      game.players["player-1"].resources.gold,
    ).toBe(1);

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(2);
  });


  it("ne modifie pas l'état initial", () => {
    const game = createPowerScenario();

    const player = game.players["player-1"];
    const powerId = "fighter-battle-stance";

    console.log({
      status: game.status,
      phase: game.phase,
      activePlayerId: game.activePlayerId,
      availablePowerIds: player.powers.availablePowerIds,
      usedThisTurn: player.powers.usedThisTurn,
      usedThisEncounter: player.powers.usedThisEncounter,
      pendingChoice: game.resolution.pendingChoice,
      powerDefinition: game.powerDefinitions[powerId],
      canUse: canUseCharacterPower(
        game,
        "player-1",
        powerId,
      ),
    });

    const snapshot = structuredClone(game);

    applyAction(game, {
      type: "USE_CHARACTER_POWER",
      playerId: "player-1",
      powerId,
    });

    expect(game).toEqual(snapshot);
  });

  it("valide les pouvoirs fictifs", () => {
    for (const power of Object.values(demoPowers)) {
      expect(
        validateCharacterPower(power),
      ).toEqual([]);
    }
  });

  it("détecte un coût négatif", () => {
    const invalidPower = {
      ...demoPowers["fighter-battle-stance"],
      cost: {
        type: "gold" as const,
        amount: -3,
      },
    };

    expect(
      validateCharacterPower(invalidPower),
    ).toContain("Coût de pouvoir invalide.");
  });

});
