import { describe, expect, it } from "vitest";

import {
  createGame,
  createPlayer,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

describe("Game factories", () => {
  it("crée un joueur avec ses ressources initiales", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    expect(player.health).toBe(50);
    expect(player.resources.gold).toBe(0);
    expect(player.resources.combat).toBe(0);

    expect(player.zones.deck).toEqual([]);
    expect(player.zones.hand).toEqual([]);
  });

  it("crée une partie solo", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const game = createGame({
      id: "game-1",
      mode: "solo",
      players: [player],
      cardDefinitions: demoCards,
    });

    expect(game.status).toBe("setup");
    expect(game.activePlayerId).toBe("player-1");
    expect(game.playerOrder).toEqual(["player-1"]);

    expect(game.players["player-1"]).toBeDefined();
    expect(game.cards).toEqual({});
  });

  it("refuse une partie sans joueur", () => {
    expect(() =>
      createGame({
        id: "game-empty",
        mode: "solo",
        players: [],
        cardDefinitions: demoCards,
      }),
    ).toThrow(
      "Une partie doit contenir au moins un joueur.",
    );
  });

  it("refuse les identifiants de joueurs dupliqués", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    expect(() =>
      createGame({
        id: "game-duplicate",
        mode: "local",
        players: [player, player],
        cardDefinitions: demoCards,
      }),
    ).toThrow(
      "Les identifiants des joueurs doivent être uniques.",
    );
  });
});