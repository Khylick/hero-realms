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
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "dagger",
      "dagger",
      "dagger",
    ],
    createSeededRandom(42),
  );

  const game = createGame({
    id: "game-1",
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

describe("Game actions", () => {
  it("démarre une partie avec cinq cartes en main", () => {
  const game = makeGame();

  const started = applyAction(game, {
    type: "START_GAME",
  });

  expect(started.status).toBe("playing");
  expect(started.phase).toBe("main");
  expect(
    started.players["player-1"].zones.hand,
  ).toHaveLength(5);

  expect(game.status).toBe("setup");
  });

  it("joue une carte et applique ses effets", () => {
      let game = applyAction(makeGame(), {
      type: "START_GAME",
      });

      const player = game.players["player-1"];

      const goldCardId = player.zones.hand.find(
      (id) =>
          game.cards[id].definitionId === "gold",
      );

      if (!goldCardId) {
      throw new Error(
          "Aucune carte d'or dans la main.",
      );
      }

      game = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: goldCardId,
      });

      expect(
      game.players["player-1"].resources.gold,
      ).toBe(1);

      expect(
      game.players["player-1"].zones.inPlay,
      ).toContain(goldCardId);
  });

  it("achète une carte et renouvelle le marché", () => {
      let game = applyAction(makeGame(), {
      type: "START_GAME",
      });

      // Pour isoler le test de l'achat,
      // nous fournissons des ressources au joueur.
      game.players["player-1"].resources.gold = 5;

      const cardId = game.market.row[0];

      game = applyAction(game, {
      type: "BUY_CARD",
      playerId: "player-1",
      cardId,
      });

      expect(
      game.players["player-1"].resources.gold,
      ).toBe(5);

      expect(
      game.players["player-1"].zones.discard,
      ).toContain(cardId);

      expect(game.cards[cardId].ownerId).toBe(
      "player-1",
      );

      expect(game.market.row).toHaveLength(5);
      expect(validateGameState(game)).toEqual([]);
  });

  it("termine le tour et prépare une nouvelle main", () => {
      let game = applyAction(makeGame(), {
      type: "START_GAME",
      });

      game = applyAction(game, {
      type: "END_TURN",
      playerId: "player-1",
      });

      const player = game.players["player-1"];

      expect(game.turnNumber).toBe(2);
      expect(player.zones.hand).toHaveLength(5);
      expect(player.resources.gold).toBe(0);
      expect(player.resources.combat).toBe(0);
      expect(validateGameState(game)).toEqual([]);
  });

  it("refuse de jouer une carte absente de la main", () => {
      const game = applyAction(makeGame(), {
      type: "START_GAME",
      });

      expect(() =>
      applyAction(game, {
          type: "PLAY_CARD",
          playerId: "player-1",
          cardId: "unknown-card",
      }),
      ).toThrow();
  });

  it("reproduit les mêmes états avec la même graine", () => {
      const first = applyAction(makeGame(), {
      type: "START_GAME",
      });

      const second = applyAction(makeGame(), {
      type: "START_GAME",
      });

      expect(first).toEqual(second);
  });

  it("déduit le coût d'une carte achetée", () => {
  let game = makeGame();

  // La carte du marché coûte désormais 3 or.
  const marketCardId = game.market.row[0];

  game.cards[marketCardId].definitionId =
    "runicBlade";

  game = applyAction(game, {
    type: "START_GAME",
  });

  game.players["player-1"].resources.gold = 5;

  const updated = applyAction(game, {
    type: "BUY_CARD",
    playerId: "player-1",
    cardId: marketCardId,
  });

  expect(
    updated.players["player-1"].resources.gold,
  ).toBe(2);

  expect(
    updated.players["player-1"].zones.discard,
  ).toContain(marketCardId);

  // L'état fourni au moteur reste inchangé.
  expect(
    game.players["player-1"].resources.gold,
  ).toBe(5);
  });
});