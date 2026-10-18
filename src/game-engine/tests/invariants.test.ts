
import { describe, expect, it } from "vitest";

import {
  createGame,
  createPlayer,
  createStartingDeck,
  createSeededRandom,
  validateGameState,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

describe("Game state invariants", () => {
  it("accepte un état cohérent", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const deckResult = createStartingDeck(
      player,
      ["gold", "gold", "dagger"],
      createSeededRandom(42),
    );

    const game = createGame({
      id: "game-1",
      mode: "solo",
      players: [deckResult.player],
      cardDefinitions: demoCards,
    });

    game.cards = deckResult.cards;

    expect(validateGameState(game)).toEqual([]);
  });

  it("détecte une carte présente dans deux zones", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const deckResult = createStartingDeck(
      player,
      ["gold"],
      createSeededRandom(42),
    );

    const game = createGame({
      id: "game-1",
      mode: "solo",
      players: [deckResult.player],
      cardDefinitions: demoCards,
    });

    game.cards = deckResult.cards;

    const cardId = deckResult.player.zones.deck[0];

    game.players["player-1"].zones.hand.push(cardId);

    expect(validateGameState(game)).toContain(
      `La carte ${cardId} apparaît dans plusieurs zones (player-1.hand).`,
    );
  });
});
