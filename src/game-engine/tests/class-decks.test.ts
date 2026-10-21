
import { describe, expect, it } from "vitest";

import {
  createClassGame,
  createClassHero,
  createMarket,
  createSeededRandom,
  applyAction,
  validateGameState,
} from "../core";

import {
  demoClasses,
} from "../../game-content/classes/demo-classes";

import {
  demoCards,
} from "../../game-content/cards/demo-cards";

describe("Class starting decks", () => {
  it("définit un deck de dix cartes pour chaque classe", () => {
    for (const definition of Object.values(
      demoClasses,
    )) {
      expect(
        definition.startingDeck,
      ).toHaveLength(10);
    }
  });

  it("utilise uniquement des cartes connues", () => {
    for (const definition of Object.values(
      demoClasses,
    )) {
      for (const cardId of definition.startingDeck) {
        expect(demoCards[cardId]).toBeDefined();
      }
    }
  });

  it("crée dix instances pour un guerrier", () => {
    const hero = createClassHero({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    expect(hero.player.zones.deck).toHaveLength(10);
    expect(Object.keys(hero.cards)).toHaveLength(10);

    expect(hero.player.zones.hand).toEqual([]);
    expect(hero.player.zones.discard).toEqual([]);
  });

  it("attribue toutes les cartes au bon joueur", () => {
    const hero = createClassHero({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    for (const card of Object.values(hero.cards)) {
      expect(card.ownerId).toBe("hero-1");
    }
  });

  it("reproduit le même deck avec la même graine", () => {
    const first = createClassHero({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    const second = createClassHero({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    expect(first).toEqual(second);
  });

  it("crée des instances indépendantes pour deux héros", () => {
    const first = createClassHero({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    const second = createClassHero({
      id: "hero-2",
      name: "Conan",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    const firstIds = Object.keys(first.cards);
    const secondIds = Object.keys(second.cards);

    expect(
      firstIds.some((id) => secondIds.includes(id)),
    ).toBe(false);

    expect(first.player.zones.deck).not.toBe(
      second.player.zones.deck,
    );
  });

  it("refuse un deck contenant une carte inconnue", () => {
    const invalidClass = {
      ...demoClasses.fighter,
      startingDeck: [
        ...demoClasses.fighter.startingDeck,
        "unknown-card",
      ],
    };

    expect(() =>
      createClassHero({
        id: "hero-invalid",
        name: "Héros",
        classDefinition: invalidClass,
        cardDefinitions: demoCards,
        random: createSeededRandom(42),
      }),
    ).toThrow(
      "Carte inconnue dans le deck de départ : unknown-card",
    );
  });

  it("refuse un deck de départ vide", () => {
    const invalidClass = {
      ...demoClasses.fighter,
      startingDeck: [],
    };

    expect(() =>
      createClassHero({
        id: "hero-invalid",
        name: "Héros",
        classDefinition: invalidClass,
        cardDefinitions: demoCards,
        random: createSeededRandom(42),
      }),
    ).toThrow(
      "Le deck de départ de la classe fighter est vide.",
    );
  });

  it("crée une partie avec deux héros équipés", () => {
    const fighter = createClassHero({
      id: "player-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(101),
    });

    const wizard = createClassHero({
      id: "player-2",
      name: "Merlin",
      classDefinition: demoClasses.wizard,
      cardDefinitions: demoCards,
      random: createSeededRandom(202),
    });

    const game = createClassGame({
      id: "game-classes",
      mode: "local",
      heroes: [fighter, wizard],
      cardDefinitions: demoCards,
      seed: 303,
    });

    expect(game.status).toBe("setup");

    expect(Object.keys(game.players)).toHaveLength(2);
    expect(Object.keys(game.cards)).toHaveLength(20);

    expect(
      game.players["player-1"].zones.deck,
    ).toHaveLength(10);

    expect(
      game.players["player-2"].zones.deck,
    ).toHaveLength(10);

    expect(validateGameState(game)).toEqual([]);
  });

  it("démarre une partie avec un héros de classe", () => {
    const hero = createClassHero({
      id: "player-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    let game = createClassGame({
      id: "game-start",
      mode: "solo",
      heroes: [hero],
      cardDefinitions: demoCards,
      seed: 123,
    });

    game = createMarket(
      game,
      Array(10).fill("dagger"),
    );

    game = applyAction(game, {
      type: "START_GAME",
    });

    expect(game.status).toBe("playing");

    expect(
      game.players["player-1"].zones.hand,
    ).toHaveLength(5);

    expect(
      game.players["player-1"].zones.deck,
    ).toHaveLength(5);

    expect(validateGameState(game)).toEqual([]);
  });

  it("ne modifie pas les définitions de classes", () => {
    const snapshot = structuredClone(
      demoClasses.fighter,
    );

    createClassHero({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
      cardDefinitions: demoCards,
      random: createSeededRandom(42),
    });

    expect(demoClasses.fighter).toEqual(snapshot);
  });

});
