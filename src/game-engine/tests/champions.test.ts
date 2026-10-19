
import { describe, expect, it } from "vitest";

import {
  applyAction,
  canActivateChampion,
  createGame,
  createMarket,
  createPlayer,
  createSeededRandom,
  createStartingDeck,
  readyChampions,
  stunChampion,
  validateGameState,
  type GameState,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

import { hasAlly } from "../core";  

function makeGame(): GameState {
  const player = createPlayer({
    id: "player-1",
    name: "Héros",
    characterClass: "fighter",
  });

  const deckResult = createStartingDeck(
    player,
    [
      "royalGuard",
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
    id: "game-champions",
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

function prepareChampionGame(): {
  game: GameState;
  guardId: string;
} {
  const started = applyAction(makeGame(), {
    type: "START_GAME",
  });

  const game = structuredClone(started);
  const player = game.players["player-1"];

  const guardId = Object.keys(game.cards).find(
    (id) =>
      game.cards[id].definitionId === "royalGuard",
  );

  if (!guardId) {
    throw new Error("Garde royal introuvable.");
  }

  if (!player.zones.hand.includes(guardId)) {
    const index = player.zones.deck.indexOf(guardId);

    if (index === -1) {
      throw new Error("Garde royal absent du deck.");
    }

    const replaced = player.zones.hand.shift();

    if (!replaced) {
      throw new Error("Main vide.");
    }

    player.zones.deck.splice(index, 1);
    player.zones.deck.push(replaced);
    player.zones.hand.push(guardId);
  }

  return { game, guardId };
}


describe("Champions", () => {
  it("place un champion dans sa zone persistante", () => {
    const { game, guardId } = prepareChampionGame();

    const played = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    const player = played.players["player-1"];

    expect(player.zones.champions).toContain(guardId);
    expect(player.zones.hand).not.toContain(guardId);
    expect(player.zones.inPlay).not.toContain(guardId);

    expect(played.cards[guardId].exhausted).toBe(false);
    expect(validateGameState(played)).toEqual([]);
  });

  it("active la capacité d'un champion", () => {
    const { game, guardId } = prepareChampionGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    expect(
      canActivateChampion(
        current,
        "player-1",
        guardId,
        "royal-guard-ability",
      ),
    ).toBe(true);

    current = applyAction(current, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: guardId,
      abilityId: "royal-guard-ability",
    });

    expect(
      current.players["player-1"].resources.combat,
    ).toBe(2);

    expect(current.cards[guardId].exhausted).toBe(true);
    expect(validateGameState(current)).toEqual([]);
  });

  it("interdit d'activer deux fois un champion épuisé", () => {
    const { game, guardId } = prepareChampionGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    current = applyAction(current, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: guardId,
      abilityId: "royal-guard-ability",
    });

    expect(() =>
      applyAction(current, {
        type: "USE_CHAMPION",
        playerId: "player-1",
        cardId: guardId,
        abilityId: "royal-guard-ability",
      }),
    ).toThrow(
      "Cette capacité de champion n'est pas disponible.",
    );
  });

  it("conserve les champions à la fin du tour", () => {
    const { game, guardId } = prepareChampionGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    current = applyAction(current, {
      type: "END_TURN",
      playerId: "player-1",
    });

    expect(
      current.players["player-1"].zones.champions,
    ).toContain(guardId);

    expect(
      current.players["player-1"].zones.discard,
    ).not.toContain(guardId);

    expect(validateGameState(current)).toEqual([]);
  });

  it("prépare les champions au prochain tour", () => {
    const { game, guardId } = prepareChampionGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    current = applyAction(current, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: guardId,
      abilityId: "royal-guard-ability",
    });

    expect(current.cards[guardId].exhausted).toBe(true);

    current = applyAction(current, {
      type: "END_TURN",
      playerId: "player-1",
    });

    expect(current.cards[guardId].exhausted).toBe(false);

    expect(
      canActivateChampion(
        current,
        "player-1",
        guardId,
        "royal-guard-ability",
      ),
    ).toBe(true);
  });

  it("réinitialise les alliances des champions", () => {
    const { game, guardId } = prepareChampionGame();

    const current = structuredClone(game);

    current.players["player-1"].zones.hand =
      current.players["player-1"].zones.hand.filter(
        (id) => id !== guardId,
      );

    current.players["player-1"].zones.champions.push(
      guardId,
    );

    current.cards[guardId].usedAbilities = [
      "test-ally",
    ];

    const ready = readyChampions(
      current,
      "player-1",
    );

    expect(ready.cards[guardId].usedAbilities).toEqual([]);
    expect(current.cards[guardId].usedAbilities).toEqual([
      "test-ally",
    ]);
  });

  it("étourdit un champion et l'envoie en défausse", () => {
    const { game, guardId } = prepareChampionGame();

    let current = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    current = applyAction(current, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: guardId,
      abilityId: "royal-guard-ability",
    });

    current = stunChampion(
      current,
      "player-1",
      guardId,
    );

    const player = current.players["player-1"];

    expect(player.zones.champions).not.toContain(guardId);
    expect(player.zones.discard).toContain(guardId);

    expect(current.cards[guardId].exhausted).toBe(false);
    expect(current.cards[guardId].usedAbilities).toEqual([]);

    expect(validateGameState(current)).toEqual([]);
  });

  it("refuse d'étourdir une carte absente des champions", () => {
    const { game, guardId } = prepareChampionGame();

    expect(() =>
      stunChampion(
        game,
        "player-1",
        guardId,
      ),
    ).toThrow(
      "Cette carte n'est pas un champion en jeu.",
    );
  });

  it("suspend et reprend la capacité d'un champion", () => {
    const { game, guardId } = prepareChampionGame();

    const current = structuredClone(game);

    // Remplacer la définition du Garde royal par
    // celle du Gardien arcanique pour ce scénario.
    current.cards[guardId].definitionId =
      "arcaneGuardian";

    let state = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    state = applyAction(state, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: guardId,
      abilityId: "arcane-guardian-ability",
    });

    expect(state.cards[guardId].exhausted).toBe(true);

    const choice = state.resolution.pendingChoice;

    expect(choice).not.toBeNull();

    if (!choice) {
      throw new Error("Choix attendu.");
    }

    const selectedCardId = choice.availableCardIds[0];

    state = applyAction(state, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: choice.id,
      selectedCardIds: [selectedCardId],
    });

    expect(state.resolution.pendingChoice).toBeNull();

    expect(
      state.players["player-1"].resources.combat,
    ).toBe(4);

    expect(state.cards[guardId].exhausted).toBe(true);

    expect(validateGameState(state)).toEqual([]);
  });


  it("un champion épuisé contribue toujours aux alliances", () => {
    const { game, guardId } = prepareChampionGame();

    const current = structuredClone(game);

    // Ajouter une Lame runique dans la main.
    const goldId = current.players[
      "player-1"
    ].zones.hand.find(
      (id) =>
        current.cards[id].definitionId === "gold",
    );

    if (!goldId) {
      throw new Error("Carte d'or introuvable.");
    }

    current.cards[goldId].definitionId = "runicBlade";

    let state = applyAction(current, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: guardId,
    });

    state = applyAction(state, {
      type: "USE_CHAMPION",
      playerId: "player-1",
      cardId: guardId,
      abilityId: "royal-guard-ability",
    });

    state = applyAction(state, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: goldId,
    });

    expect(state.cards[guardId].exhausted).toBe(true);

    expect(
      hasAlly(state, "player-1", goldId),
    ).toBe(true);

    expect(validateGameState(state)).toEqual([]);
  });
  
});