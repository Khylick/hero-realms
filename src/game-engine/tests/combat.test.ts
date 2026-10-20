import { describe, expect, it } from "vitest";

import {
  applyAction,
  canTargetChampion,
  canTargetPlayer,
  createCard,
  createGame,
  createPlayer,
  getGuardCards,
  hasGuard,
  validateGameState,
  type GameState,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

function makeCombatGame(): GameState {
  const attacker = createPlayer({
    id: "player-1",
    name: "Attaquant",
    characterClass: "fighter",
  });

  const defender = createPlayer({
    id: "player-2",
    name: "Défenseur",
    characterClass: "wizard",
  });

  const game = createGame({
    id: "game-combat",
    mode: "local",
    players: [attacker, defender],
    cardDefinitions: demoCards,
  });

  game.status = "playing";
  game.phase = "main";
  game.activePlayerId = "player-1";

  game.players["player-1"].resources.combat = 10;

  return game;
}

function addChampion(
  game: GameState,
  id: string,
  definitionId: string,
): GameState {
  const next = structuredClone(game);

  next.cards[id] = createCard({
    id,
    definitionId,
    ownerId: "player-2",
  });

  next.players["player-2"].zones.champions.push(id);

  return next;
}


describe("Combat and guards", () => {
  it("détecte les gardes d'un joueur", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    expect(
      getGuardCards(game, "player-2"),
    ).toEqual(["guard-1"]);

    expect(hasGuard(game, "player-2")).toBe(true);
  });

  it("empêche de cibler un champion non-garde protégé", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    game = addChampion(
      game,
      "mage-1",
      "battleMage",
    );

    expect(
      canTargetChampion(
        game,
        "player-2",
        "mage-1",
      ),
    ).toBe(false);

    expect(
      canTargetChampion(
        game,
        "player-2",
        "guard-1",
      ),
    ).toBe(true);
  });

  it("empêche d'attaquer un joueur protégé", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    expect(
      canTargetPlayer(game, "player-2"),
    ).toBe(false);

    expect(() =>
      applyAction(game, {
        type: "ATTACK_PLAYER",
        playerId: "player-1",
        targetPlayerId: "player-2",
        amount: 3,
      }),
    ).toThrow(
      "Ce joueur est protégé par un garde.",
    );
  });
  
  it("dépense du combat et étourdit un champion", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    const updated = applyAction(game, {
      type: "ATTACK_CHAMPION",
      playerId: "player-1",
      targetPlayerId: "player-2",
      cardId: "guard-1",
    });

    expect(
      updated.players["player-1"].resources.combat,
    ).toBe(6);

    expect(
      updated.players["player-2"].zones.champions,
    ).not.toContain("guard-1");

    expect(
      updated.players["player-2"].zones.discard,
    ).toContain("guard-1");

    expect(validateGameState(updated)).toEqual([]);
  });

  it("refuse une attaque avec un combat insuffisant", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    game.players["player-1"].resources.combat = 2;

    expect(() =>
      applyAction(game, {
        type: "ATTACK_CHAMPION",
        playerId: "player-1",
        targetPlayerId: "player-2",
        cardId: "guard-1",
      }),
    ).toThrow();
  });

  it("permet de cibler un non-garde après retrait du garde", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    game = addChampion(
      game,
      "mage-1",
      "battleMage",
    );

    game = applyAction(game, {
      type: "ATTACK_CHAMPION",
      playerId: "player-1",
      targetPlayerId: "player-2",
      cardId: "guard-1",
    });

    expect(
      canTargetChampion(
        game,
        "player-2",
        "mage-1",
      ),
    ).toBe(true);

    game = applyAction(game, {
      type: "ATTACK_CHAMPION",
      playerId: "player-1",
      targetPlayerId: "player-2",
      cardId: "mage-1",
    });

    expect(
      game.players["player-1"].resources.combat,
    ).toBe(3);

    expect(
      game.players["player-2"].zones.discard,
    ).toContain("mage-1");

    expect(validateGameState(game)).toEqual([]);
  });

  
  it("inflige des dégâts à un joueur sans garde", () => {
    const game = makeCombatGame();

    const updated = applyAction(game, {
      type: "ATTACK_PLAYER",
      playerId: "player-1",
      targetPlayerId: "player-2",
      amount: 4,
    });

    expect(
      updated.players["player-2"].health,
    ).toBe(46);

    expect(
      updated.players["player-1"].resources.combat,
    ).toBe(6);

    expect(validateGameState(updated)).toEqual([]);
  });

  it("marque un joueur vaincu lorsque ses PV atteignent zéro", () => {
    const game = makeCombatGame();

    game.players["player-2"].health = 3;

    const updated = applyAction(game, {
      type: "ATTACK_PLAYER",
      playerId: "player-1",
      targetPlayerId: "player-2",
      amount: 5,
    });

    expect(
      updated.players["player-2"].health,
    ).toBe(0);

    expect(
      updated.players["player-2"].defeated,
    ).toBe(true);
  });

  it("refuse une attaque contre soi-même", () => {
    const game = makeCombatGame();

    expect(() =>
      applyAction(game, {
        type: "ATTACK_PLAYER",
        playerId: "player-1",
        targetPlayerId: "player-1",
        amount: 2,
      }),
    ).toThrow(
      "Un joueur ne peut pas s'attaquer lui-même.",
    );
  });

  
  it("ne modifie pas l'état initial pendant une attaque", () => {
    let game = makeCombatGame();

    game = addChampion(
      game,
      "guard-1",
      "royalGuard",
    );

    const snapshot = structuredClone(game);

    applyAction(game, {
      type: "ATTACK_CHAMPION",
      playerId: "player-1",
      targetPlayerId: "player-2",
      cardId: "guard-1",
    });

    expect(game).toEqual(snapshot);
  });

});

