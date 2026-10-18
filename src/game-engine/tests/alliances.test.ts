import { describe, expect, it } from "vitest";

import {
  applyAction,
  canActivateAlly,
  createGame,
  createMarket,
  createPlayer,
  createSeededRandom,
  createStartingDeck,
  getAvailableAllyAbilities,
  hasAlly,
  validateGameState,
  type GameState,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

function makeGame(): GameState {
  const player = createPlayer({
    id: "player-1",
    name: "Héros",
    characterClass: "fighter",
  });

  const deckResult = createStartingDeck(
    player,
    [
      "runicBlade",
      "imperialScout",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
    ],
    createSeededRandom(42),
  );

  const game = createGame({
    id: "game-allies",
    mode: "solo",
    players: [deckResult.player],
    cardDefinitions: demoCards,
    seed: 123,
  });

  game.cards = deckResult.cards;

  return createMarket(
    game,
    Array(10).fill("dagger"),
  );
}

function prepareGame(): {
  game: GameState;
  bladeId: string;
  scoutId: string;
} {
  const started = applyAction(makeGame(), {
    type: "START_GAME",
  });

  const game = structuredClone(started);
  const player = game.players["player-1"];

  const bladeId = Object.keys(game.cards).find(
    (id) =>
      game.cards[id].definitionId === "runicBlade",
  );

  const scoutId = Object.keys(game.cards).find(
    (id) =>
      game.cards[id].definitionId === "imperialScout",
  );

  if (!bladeId || !scoutId) {
    throw new Error("Cartes de test introuvables.");
  }

  // Placer les deux cartes dans la main,
  // indépendamment du mélange initial.
  for (const cardId of [bladeId, scoutId]) {
    if (player.zones.hand.includes(cardId)) {
      continue;
    }

    const index = player.zones.deck.indexOf(cardId);

    if (index === -1) {
      throw new Error("Carte absente de la pioche.");
    }

    const replacedCardId = player.zones.hand.shift();

    if (!replacedCardId) {
      throw new Error("Main vide.");
    }

    player.zones.deck.splice(index, 1);
    player.zones.deck.push(replacedCardId);
    player.zones.hand.push(cardId);
  }

  return { game, bladeId, scoutId };
}

describe("Ally abilities", () => {
  it("ne permet pas à une carte de s'allier seule", () => {
    const { game, bladeId } = prepareGame();

    const played = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    expect(
      hasAlly(played, "player-1", bladeId),
    ).toBe(false);

    expect(
      canActivateAlly(
        played,
        "player-1",
        bladeId,
        "runic-blade-ally",
      ),
    ).toBe(false);
  });

  it("rend les deux alliances disponibles", () => {
    const { game, bladeId, scoutId } = prepareGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    current = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scoutId,
    });

    const available = getAvailableAllyAbilities(
      current,
      "player-1",
    );

    expect(available).toHaveLength(2);

    expect(
      available.map((item) => item.ability.id),
    ).toContain("runic-blade-ally");

    expect(
      available.map((item) => item.ability.id),
    ).toContain("imperial-scout-ally");
  });

  it("active une alliance et applique ses effets", () => {
    const { game, bladeId, scoutId } = prepareGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    current = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scoutId,
    });

    current = applyAction(current, {
      type: "ACTIVATE_ALLY",
      playerId: "player-1",
      cardId: scoutId,
      abilityId: "imperial-scout-ally",
    });

    const player = current.players["player-1"];

    expect(player.resources.combat).toBe(5);
    expect(player.resources.gold).toBe(1);

    expect(
      current.cards[scoutId].usedAbilities,
    ).toContain("imperial-scout-ally");

    expect(validateGameState(current)).toEqual([]);
  });

  it("refuse une double activation", () => {
    const { game, bladeId, scoutId } = prepareGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    current = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scoutId,
    });

    current = applyAction(current, {
      type: "ACTIVATE_ALLY",
      playerId: "player-1",
      cardId: scoutId,
      abilityId: "imperial-scout-ally",
    });

    expect(() =>
      applyAction(current, {
        type: "ACTIVATE_ALLY",
        playerId: "player-1",
        cardId: scoutId,
        abilityId: "imperial-scout-ally",
      }),
    ).toThrow(
      "Cette capacité d'alliance n'est pas disponible.",
    );
  });

  it("fonctionne quel que soit l'ordre des cartes", () => {
    const { game, bladeId, scoutId } = prepareGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scoutId,
    });

    current = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    expect(
      getAvailableAllyAbilities(
        current,
        "player-1",
      ),
    ).toHaveLength(2);
  });

  
  it("résout un effet de pioche issu d'une alliance", () => {
    const { game, bladeId, scoutId } = prepareGame();

    let current = applyAction(game, {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: bladeId,
    });

    current = applyAction(current, {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: scoutId,
    });

    const handSizeBefore =
        current.players["player-1"].zones.hand.length;

    current = applyAction(current, {
        type: "ACTIVATE_ALLY",
        playerId: "player-1",
        cardId: bladeId,
        abilityId: "runic-blade-ally",
    });

    expect(
        current.players["player-1"].zones.hand,
    ).toHaveLength(handSizeBefore + 1);

    expect(
        current.cards[bladeId].usedAbilities,
    ).toContain("runic-blade-ally");

    expect(validateGameState(current)).toEqual([]);
  });

  
  it("réinitialise les alliances des cartes en fin de tour", () => {
    const { game, bladeId, scoutId } = prepareGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    current = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scoutId,
    });

    current = applyAction(current, {
      type: "ACTIVATE_ALLY",
      playerId: "player-1",
      cardId: scoutId,
      abilityId: "imperial-scout-ally",
    });

    expect(
      current.cards[scoutId].usedAbilities,
    ).toContain("imperial-scout-ally");

    current = applyAction(current, {
      type: "END_TURN",
      playerId: "player-1",
    });

    expect(
      current.cards[scoutId].usedAbilities,
    ).toEqual([]);

    expect(
      current.players["player-1"].zones.inPlay,
    ).toEqual([]);

    expect(
      current.players["player-1"].zones.discard,
    ).toContain(scoutId);

    expect(validateGameState(current)).toEqual([]);
  });

  
  it("prend en compte un champion allié déjà en jeu", () => {
    const { game, bladeId } = prepareGame();

    const current = structuredClone(game);
    const player = current.players["player-1"];

    // Créer un champion fictif directement dans sa zone.
    const guardId = "test-royal-guard";

    current.cards[guardId] = {
      id: guardId,
      definitionId: "royalGuard",
      ownerId: "player-1",
      exhausted: false,
      usedAbilities: [],
    };

    player.zones.champions.push(guardId);

    const played = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: bladeId,
    });

    expect(
      hasAlly(played, "player-1", bladeId),
    ).toBe(true);

    expect(
      canActivateAlly(
        played,
        "player-1",
        bladeId,
        "runic-blade-ally",
      ),
    ).toBe(true);

    expect(validateGameState(played)).toEqual([]);
  });

});
