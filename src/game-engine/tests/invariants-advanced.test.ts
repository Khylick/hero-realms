import { describe, expect, it } from "vitest";

import { validateGameState } from "../core";

import {
  addCardToZone,
  createScenario,
} from "./helpers/scenario-builder";

describe("Advanced invariants", () => {
  it("accepte un état valide", () => {
    const game = createScenario();

    expect(validateGameState(game)).toEqual([]);
  });

  it("détecte une ressource négative", () => {
    const game = createScenario();

    game.players["player-1"].resources.combat = -2;

    const errors = validateGameState(game);

    console.log("Erreurs ressources :", errors);

    expect(errors).toContain(
        "Ressource invalide : player-1.combat",
    );
  });

  it("détecte des points de vie invalides", () => {
    const game = createScenario();

    game.players["player-1"].health = 999;

    expect(validateGameState(game)).toContain(
      "Points de vie invalides : player-1",
    );
  });

  it("détecte une défaite incohérente", () => {
    const game = createScenario();

    game.players["player-1"].health = 0;
    game.players["player-1"].defeated = false;

    const errors = validateGameState(game);

    console.log("Erreurs défaite :", errors);

    expect(errors).toContain(
      "État de défaite incohérent : player-1",
    );
  });

  it("détecte une carte dupliquée entre deux zones", () => {
    let game = createScenario();

    game = addCardToZone(
      game,
      "player-1",
      "gold-1",
      "gold",
      "hand",
    );

    game.players["player-1"].zones.discard.push(
      "gold-1",
    );

    expect(
      validateGameState(game).length,
    ).toBeGreaterThan(0);
  });

  it("détecte un choix avec des cartes indisponibles", () => {
    const game = createScenario();

    game.resolution.pendingChoice = {
      id: "choice-test",
      playerId: "player-1",
      type: "selectCards",
      from: "hand",
      action: "discard",
      amount: 1,
      availableCardIds: ["unknown-card"],
    };

    expect(validateGameState(game)).toContain(
      "Carte indisponible dans le choix : unknown-card",
    );
  });
});
