
import { describe, expect, it } from "vitest";

import {
  applyAction,
  canUseCharacterPower,
  createClassGame,
  createClassHero,
  createSeededRandom,
  getLevelForExperience,
  validateClassProgression,
  validateGameState,
  type GameState,
} from "../core";

import {
  demoClasses,
} from "../../game-content/classes/demo-classes";

import {
  demoPowers,
} from "../../game-content/classes/demo-powers";

import {
  demoProgressions,
} from "../../game-content/classes/demo-progressions";

import {
  demoCards,
} from "../../game-content/cards/demo-cards";

function createProgressionScenario(): GameState {
  const hero = createClassHero({
    id: "player-1",
    name: "Arthas",
    classDefinition: demoClasses.fighter,
    cardDefinitions: demoCards,
    random: createSeededRandom(42),
  });

  const game = createClassGame({
    id: "progression-test",
    mode: "solo",
    heroes: [hero],
    cardDefinitions: demoCards,
    powerDefinitions: demoPowers,
    classProgressions: demoProgressions,
    seed: 123,
  });

  game.status = "playing";
  game.phase = "main";

  return game;
}

describe("Character progression", () => {
  it("valide les progressions fictives", () => {
    for (const progression of Object.values(
      demoProgressions,
    )) {
      expect(
        validateClassProgression(progression),
      ).toEqual([]);
    }
  });

  it("calcule le niveau selon l'expérience", () => {
    const progression = demoProgressions.fighter!;

    expect(
      getLevelForExperience(progression, 0).level,
    ).toBe(1);

    expect(
      getLevelForExperience(progression, 9).level,
    ).toBe(1);

    expect(
      getLevelForExperience(progression, 10).level,
    ).toBe(2);

    expect(
      getLevelForExperience(progression, 24).level,
    ).toBe(2);

    expect(
      getLevelForExperience(progression, 25).level,
    ).toBe(3);
  });

  it("refuse une expérience négative", () => {
    expect(() =>
      getLevelForExperience(
        demoProgressions.fighter!,
        -1,
      ),
    ).toThrow(
      "L'expérience doit être un entier positif ou nul.",
    );
  });

  it("ajoute de l'expérience sans monter de niveau", () => {
    let game = createProgressionScenario();

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 5,
    });

    const player = game.players["player-1"];

    expect(player.experience).toBe(5);
    expect(player.level).toBe(1);
    expect(player.maxHealth).toBe(50);
  });

  it("fait monter un héros au niveau 2", () => {
    let game = createProgressionScenario();

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 10,
    });

    const player = game.players["player-1"];

    expect(player.experience).toBe(10);
    expect(player.level).toBe(2);

    expect(player.maxHealth).toBe(55);
    expect(player.health).toBe(55);
  });

  it("débloque un pouvoir au niveau 2", () => {
    let game = createProgressionScenario();

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-battle-cry",
      ),
    ).toBe(false);

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 10,
    });

    expect(
      game.players["player-1"].powers.availablePowerIds,
    ).toContain("fighter-battle-cry");

    expect(
      canUseCharacterPower(
        game,
        "player-1",
        "fighter-battle-cry",
      ),
    ).toBe(true);
  });

  it("gère plusieurs niveaux gagnés simultanément", () => {
    let game = createProgressionScenario();

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 30,
    });

    const player = game.players["player-1"];

    expect(player.experience).toBe(30);
    expect(player.level).toBe(3);

    expect(player.maxHealth).toBe(60);
    expect(player.health).toBe(60);

    expect(
      player.powers.availablePowerIds,
    ).toContain("fighter-battle-cry");
  });

  it("n'applique pas deux fois un bonus de niveau", () => {
    let game = createProgressionScenario();

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 10,
    });

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 5,
    });

    const player = game.players["player-1"];

    expect(player.experience).toBe(15);
    expect(player.level).toBe(2);
    expect(player.maxHealth).toBe(55);

    expect(
      player.powers.availablePowerIds.filter(
        (id) => id === "fighter-battle-cry",
      ),
    ).toHaveLength(1);
  });

  it("refuse un gain d'expérience négatif", () => {
    const game = createProgressionScenario();

    expect(() =>
      applyAction(game, {
        type: "GAIN_EXPERIENCE",
        playerId: "player-1",
        amount: -5,
      }),
    ).toThrow(
      "Le gain d'expérience doit être un entier positif ou nul.",
    );
  });

  it("refuse une progression inexistante", () => {
    const game = createProgressionScenario();

    delete game.classProgressions.fighter;

    expect(() =>
      applyAction(game, {
        type: "GAIN_EXPERIENCE",
        playerId: "player-1",
        amount: 10,
      }),
    ).toThrow(
      "Progression introuvable pour la classe fighter.",
    );
  });

  it("ne dépasse pas le niveau maximum défini", () => {
    let game = createProgressionScenario();

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 1000,
    });

    const player = game.players["player-1"];

    expect(player.experience).toBe(1000);
    expect(player.level).toBe(3);
    expect(player.maxHealth).toBe(60);
  });

  it("ne modifie pas l'état initial", () => {
    const game = createProgressionScenario();
    const snapshot = structuredClone(game);

    applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 15,
    });

    expect(game).toEqual(snapshot);
  });

  it("conserve un état valide après progression", () => {
    let game = createProgressionScenario();

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "player-1",
      amount: 30,
    });

    expect(validateGameState(game)).toEqual([]);
  });

});
