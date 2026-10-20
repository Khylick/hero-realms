
import { describe, expect, it } from "vitest";

import {
  applyAction,
  validateGameState,
  type GameState,
} from "../core";

import {
  addCardToZone,
  addCombat,
  createScenario,
} from "./helpers/scenario-builder";

function prepareFullTurn(): GameState {
  let game = createScenario();

  // Cartes de la main du joueur actif.
  game = addCardToZone(
    game,
    "player-1",
    "blade",
    "runicBlade",
    "hand",
  );

  game = addCardToZone(
    game,
    "player-1",
    "scout",
    "imperialScout",
    "hand",
  );

  game = addCardToZone(
    game,
    "player-1",
    "strategist",
    "imperialStrategist",
    "hand",
  );

  game = addCardToZone(
    game,
    "player-1",
    "gold-1",
    "gold",
    "hand",
  );

  game = addCardToZone(
    game,
    "player-1",
    "gold-2",
    "gold",
    "hand",
  );

  // Cartes supplémentaires pour la pioche.
  for (let index = 1; index <= 10; index++) {
    game = addCardToZone(
      game,
      "player-1",
      `deck-${index}`,
      "gold",
      "deck",
    );
  }

  // Champion déjà en jeu chez l'attaquant.
  game = addCardToZone(
    game,
    "player-1",
    "my-guard",
    "royalGuard",
    "champions",
  );

  // Champions adverses.
  game = addCardToZone(
    game,
    "player-2",
    "enemy-guard",
    "royalGuard",
    "champions",
  );

  game = addCardToZone(
    game,
    "player-2",
    "enemy-mage",
    "battleMage",
    "champions",
  );

  return game;
}

describe("Full turn integration", () => {
  it("enchaîne les effets, les alliances et le combat", () => {
    let game = prepareFullTurn();

    expect(validateGameState(game)).toEqual([]);

    // 1. Jouer les trois cartes impériales.
    for (const cardId of [
      "blade",
      "scout",
      "strategist",
    ]) {
      game = applyAction(game, {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId,
      });
    }

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(3);

    expect(
      game.players["player-1"].resources.gold,
    ).toBe(2);

    // 2. Activer l'alliance de l'Éclaireur.
    game = applyAction(game, {
      type: "ACTIVATE_ALLY",
      playerId: "player-1",
      cardId: "scout",
      abilityId: "imperial-scout-ally",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(5);

    // 3. Activer l'alliance de la Lame.
    game = applyAction(game, {
      type: "ACTIVATE_ALLY",
      playerId: "player-1",
      cardId: "blade",
      abilityId: "runic-blade-ally",
    });

    // 4. Activer l'alliance du Stratège.
    game = applyAction(game, {
      type: "ACTIVATE_ALLY",
      playerId: "player-1",
      cardId: "strategist",
      abilityId: "imperial-strategist-ally",
    });

    const choice = game.resolution.pendingChoice;

    expect(choice).not.toBeNull();

    if (!choice) {
      throw new Error("Choix attendu.");
    }

    // Le joueur défausse une carte d'or.
    const selectedCardId =
      choice.availableCardIds.find(
        (id) => id === "gold-1",
      );

    if (!selectedCardId) {
      throw new Error("Carte à défausser absente.");
    }

    game = applyAction(game, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: choice.id,
      selectedCardIds: [selectedCardId],
    });

    expect(game.resolution.pendingChoice).toBeNull();

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(8);

    // 5. Activer le Garde royal.
    game = applyAction(game, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: "my-guard",
      abilityId: "royal-guard-ability",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(10);

    // 6. Attaquer le garde adverse.
    game = applyAction(game, {
      type: "ATTACK_CHAMPION",
      playerId: "player-1",
      targetPlayerId: "player-2",
      cardId: "enemy-guard",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(6);

    // 7. Attaquer le Mage de bataille.
    game = applyAction(game, {
      type: "ATTACK_CHAMPION",
      playerId: "player-1",
      targetPlayerId: "player-2",
      cardId: "enemy-mage",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(3);

    // 8. Infliger les dégâts restants.
    game = applyAction(game, {
      type: "ATTACK_PLAYER",
      playerId: "player-1",
      targetPlayerId: "player-2",
      amount: 3,
    });

    expect(
      game.players["player-2"].health,
    ).toBe(47);

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(0);

    expect(validateGameState(game)).toEqual([]);
  });

  it("interdit toute attaque pendant un choix d'alliance", () => {
    let game = prepareFullTurn();

    for (const cardId of [
        "blade",
        "strategist",
    ]) {
        game = applyAction(game, {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId,
        });
    }

    game = applyAction(game, {
        type: "ACTIVATE_ALLY",
        playerId: "player-1",
        cardId: "strategist",
        abilityId: "imperial-strategist-ally",
    });

    expect(game.resolution.pendingChoice).not.toBeNull();

    expect(() =>
        applyAction(game, {
        type: "ATTACK_CHAMPION",
        playerId: "player-1",
        targetPlayerId: "player-2",
        cardId: "enemy-guard",
        }),
    ).toThrow("Un choix doit être résolu");
  });

  it("conserve les champions et prépare le joueur suivant", () => {
    let game = prepareFullTurn();

    game = applyAction(game, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: "my-guard",
      abilityId: "royal-guard-ability",
    });

    expect(game.cards["my-guard"].exhausted).toBe(true);

    game = applyAction(game, {
      type: "END_TURN",
      playerId: "player-1",
    });

    expect(
      game.players["player-1"].zones.champions,
    ).toContain("my-guard");

    // Le joueur 2 devient actif.
    expect(game.activePlayerId).toBe("player-2");

    // Le champion du joueur 1 reste épuisé
    // pendant le tour du joueur 2.
    expect(game.cards["my-guard"].exhausted).toBe(true);

    expect(validateGameState(game)).toEqual([]);
  });
  
  it("ne consomme pas de combat lorsqu'une attaque échoue", () => {
    const game = addCombat(
      prepareFullTurn(),
      "player-1",
      10,
    );

    const snapshot = structuredClone(game);

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CHAMPION",
        playerId: "player-1",
        targetPlayerId: "player-2",
        cardId: "enemy-mage",
      }),
    ).toThrow(
      "Ce champion ne peut pas être ciblé.",
    );

    expect(game).toEqual(snapshot);

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(10);
  });


});
