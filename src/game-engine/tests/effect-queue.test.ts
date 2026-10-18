import { describe, expect, it } from "vitest";

import {
  applyAction,
  createGame,
  createMarket,
  createPlayer,
  createSeededRandom,
  createStartingDeck,
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
      "tacticalScroll",
      "gold",
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
    id: "game-effects",
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

function prepareScrollGame(): {
  game: GameState;
  scrollId: string;
} {
  let game = applyAction(makeGame(), {
    type: "START_GAME",
  });

  const player = game.players["player-1"];

  const scrollId = Object.keys(game.cards).find(
    (id) =>
      game.cards[id].definitionId ===
      "tacticalScroll",
  );

  if (!scrollId) {
    throw new Error("Parchemin introuvable.");
  }

  // Nous préparons une main contrôlée pour ce test.
  // Le parchemin doit être jouable immédiatement.
  if (!player.zones.hand.includes(scrollId)) {
    const deck = [...player.zones.deck];
    const index = deck.indexOf(scrollId);

    if (index === -1) {
      throw new Error("Parchemin absent du deck.");
    }

    const replaced = player.zones.hand[0];

    deck.splice(index, 1);
    deck.push(replaced);

    game = structuredClone(game);

    game.players["player-1"].zones.deck = deck;

    game.players["player-1"].zones.hand = [
      scrollId,
      ...player.zones.hand.slice(1),
    ];
  }

  return { game, scrollId };
}

describe("Effect queue", () => {
  it("suspend une capacité lorsqu'un choix est nécessaire", () => {
    const { game, scrollId } = prepareScrollGame();

    const updated = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const player = updated.players["player-1"];

    expect(player.resources.combat).toBe(2);
    expect(player.resources.gold).toBe(0);

    expect(
      updated.resolution.pendingChoice,
    ).not.toBeNull();

    expect(updated.resolution.queue).toHaveLength(1);
    expect(validateGameState(updated)).toEqual([]);
  });

  it("reprend la résolution après le choix", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const choice = suspended.resolution.pendingChoice;

    if (!choice) {
      throw new Error("Choix attendu.");
    }

    const selectedCardId = choice.availableCardIds[0];

    const resumed = applyAction(suspended, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: choice.id,
      selectedCardIds: [selectedCardId],
    });

    expect(
      resumed.resolution.pendingChoice,
    ).toBeNull();

    expect(resumed.resolution.queue).toHaveLength(0);

    expect(
      resumed.players["player-1"].resources.gold,
    ).toBe(1);

    expect(
      resumed.players["player-1"].zones.discard,
    ).toContain(selectedCardId);

    expect(validateGameState(resumed)).toEqual([]);
  });

  it("interdit de terminer le tour pendant un choix", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    expect(() =>
      applyAction(suspended, {
        type: "END_TURN",
        playerId: "player-1",
      }),
    ).toThrow(
      "Un choix doit être résolu",
    );
  });

  it("refuse une réponse provenant d'un autre joueur", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const choice = suspended.resolution.pendingChoice!;

    expect(() =>
      applyAction(suspended, {
        type: "RESOLVE_CHOICE",
        playerId: "player-2",
        choiceId: choice.id,
        selectedCardIds: [choice.availableCardIds[0]],
      }),
    ).toThrow(
      "Ce choix appartient à un autre joueur.",
    );
  });

  it("refuse une carte qui ne fait pas partie du choix", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const choice = suspended.resolution.pendingChoice!;

    expect(() =>
      applyAction(suspended, {
        type: "RESOLVE_CHOICE",
        playerId: "player-1",
        choiceId: choice.id,
        selectedCardIds: ["unknown-card"],
      }),
    ).toThrow("Carte non autorisée");
  });

  it("ne modifie pas l'état initial", () => {
    const { game, scrollId } = prepareScrollGame();

    const snapshot = structuredClone(game);

    applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    expect(game).toEqual(snapshot);
  });

  
  it("reproduit une résolution identique", () => {
    const { game, scrollId } = prepareScrollGame();

    const action = {
      type: "PLAY_CARD" as const,
      playerId: "player-1",
      cardId: scrollId,
    };

    const first = applyAction(game, action);
    const second = applyAction(game, action);

    expect(first).toEqual(second);
    expect(first.randomState).toBe(second.randomState);
  });
});