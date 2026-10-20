import { describe, expect, it } from "vitest";

import {
  applyAction,
  type GameAction,
  type GameState,
} from "../core";

import {
  addCardToZone,
  createScenario,
} from "./helpers/scenario-builder";

function prepareReplayGame(): GameState {
  let game = createScenario();

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

  for (let index = 1; index <= 8; index++) {
    game = addCardToZone(
      game,
      "player-1",
      `gold-${index}`,
      "gold",
      "deck",
    );
  }

  return game;
}

function replay(
  initial: GameState,
  actions: GameAction[],
): GameState {
  return actions.reduce(
    (state, action) => applyAction(state, action),
    initial,
  );
}

describe("Deterministic replay", () => {
  it("reproduit exactement le même état", () => {
    const initial = prepareReplayGame();

    const actions: GameAction[] = [
      {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: "blade",
      },
      {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: "scout",
      },
      {
        type: "ACTIVATE_ALLY",
        playerId: "player-1",
        cardId: "blade",
        abilityId: "runic-blade-ally",
      },
    ];

    const first = replay(initial, actions);
    const second = replay(initial, actions);

    expect(first).toEqual(second);

    expect(first.randomState).toBe(
      second.randomState,
    );
  });

  it("ne modifie jamais l'état initial", () => {
    const initial = prepareReplayGame();
    const snapshot = structuredClone(initial);

    replay(initial, [
      {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: "blade",
      },
    ]);

    expect(initial).toEqual(snapshot);
  });

});
