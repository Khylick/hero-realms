import { describe, expect, it } from "vitest";

import {
  applyAction,
  createGame,
  createMarket,
  createPlayer,
  createSeededRandom,
  createStartingDeck,
  type GameState,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

function makeMarketGame(marketCardCount = 7): GameState {
  const player = createPlayer({
    id: "player-1",
    name: "Héros",
    characterClass: "fighter",
  });
  const deckResult = createStartingDeck(
    player,
    Array(10).fill("gold"),
    createSeededRandom(42),
  );
  const game = createGame({
    id: "market-recycling",
    mode: "solo",
    players: [deckResult.player],
    cardDefinitions: demoCards,
    seed: 24,
  });

  game.cards = deckResult.cards;

  return applyAction(
    createMarket(
      game,
      Array(marketCardCount).fill("dagger"),
    ),
    { type: "START_GAME" },
  );
}

function buyWithExhaustedMarketDeck(
  game: GameState,
): GameState {
  const prepared = structuredClone(game);
  prepared.market.sacrificed = [...prepared.market.deck];
  prepared.market.deck = [];
  prepared.players["player-1"].resources.gold = 10;

  return applyAction(prepared, {
    type: "BUY_CARD",
    playerId: "player-1",
    cardId: prepared.market.row[0],
  });
}

describe("Market recycling", () => {
  it("remélange la pile de sacrifice quand la pioche est vide", () => {
    const game = makeMarketGame();
    const recycledIds = [...game.market.deck];

    const updated = buyWithExhaustedMarketDeck(game);

    expect(updated.market.row).toHaveLength(5);
    expect(updated.market.sacrificed).toEqual([]);
    expect(updated.market.row.some((id) => recycledIds.includes(id))).toBe(
      true,
    );
    expect(updated.market.deck).toHaveLength(recycledIds.length - 1);
    expect(game.market.deck).toEqual(recycledIds);
  });

  it("recycle le marché de façon déterministe", () => {
    const first = buyWithExhaustedMarketDeck(makeMarketGame());
    const second = buyWithExhaustedMarketDeck(makeMarketGame());

    expect(first.market.row).toEqual(second.market.row);
    expect(first.market.deck).toEqual(second.market.deck);
    expect(first.randomState).toBe(second.randomState);
  });

  it("laisse la rangée diminuer si aucune pile ne peut la remplacer", () => {
    const game = makeMarketGame(5);
    game.players["player-1"].resources.gold = 10;

    const updated = applyAction(game, {
      type: "BUY_CARD",
      playerId: "player-1",
      cardId: game.market.row[0],
    });

    expect(updated.market.row).toHaveLength(4);
    expect(updated.market.deck).toEqual([]);
    expect(updated.market.sacrificed).toEqual([]);
  });
});
