
import { describe, expect, it } from "vitest";

import {
  createPlayer,
  createSeededRandom,
  createStartingDeck,
  drawCards,
  discardCard,
  sacrificeCard,
  shuffle,
} from "../core";

describe("Deck management", () => {
  it("mélange les cartes de manière reproductible", () => {
    const cards = ["a", "b", "c", "d", "e"];

    const resultA = shuffle(
      cards,
      createSeededRandom(42),
    );

    const resultB = shuffle(
      cards,
      createSeededRandom(42),
    );

    expect(resultA).toEqual(resultB);
    expect(resultA).toHaveLength(cards.length);
    expect(cards).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("crée un deck de départ", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const result = createStartingDeck(
      player,
      ["gold", "gold", "dagger"],
      createSeededRandom(42),
    );

    expect(result.player.zones.deck).toHaveLength(3);
    expect(Object.keys(result.cards)).toHaveLength(3);
    expect(player.zones.deck).toHaveLength(0);
  });

  it("pioche des cartes depuis le deck", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const withDeck = {
      ...player,
      zones: {
        ...player.zones,
        deck: ["a", "b", "c"],
      },
    };

    const result = drawCards(
      withDeck,
      2,
      createSeededRandom(42),
    );

    expect(result.zones.hand).toEqual(["c", "b"]);
    expect(result.zones.deck).toEqual(["a"]);
  });

  it("recycle la défausse si le deck est vide", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const withCards = {
      ...player,
      zones: {
        ...player.zones,
        deck: ["a"],
        discard: ["b", "c"],
      },
    };

    const result = drawCards(
      withCards,
      3,
      createSeededRandom(42),
    );

    expect(result.zones.hand).toHaveLength(3);
    expect(result.zones.deck).toHaveLength(0);
    expect(result.zones.discard).toHaveLength(0);

    expect(result.zones.hand).toContain("a");
    expect(result.zones.hand).toContain("b");
    expect(result.zones.hand).toContain("c");
  });

  it("défausse une carte depuis la main", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const withHand = {
      ...player,
      zones: {
        ...player.zones,
        hand: ["a", "b"],
      },
    };

    const result = discardCard(withHand, "a");

    expect(result.zones.hand).toEqual(["b"]);
    expect(result.zones.discard).toEqual(["a"]);
  });

  it("sacrifie une carte", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const withHand = {
      ...player,
      zones: {
        ...player.zones,
        hand: ["a"],
      },
    };

    const result = sacrificeCard(
      withHand,
      "a",
      "hand",
    );

    expect(result.zones.hand).toEqual([]);
    expect(result.zones.sacrificed).toEqual(["a"]);
  });
});
