
import type { GameState } from "../types/game-state";
import type { PlayerState } from "../types/player";
import type { CardDefinition } from "../types/card";
import type { GameMode } from "../types/common";

interface CreateGameOptions {
  id: string;
  mode: GameMode;
  players: PlayerState[];
  cardDefinitions: Record<string, CardDefinition>;
  seed?: number;
}

export function createGame({
  id,
  mode,
  players,
  cardDefinitions,
  seed = 42,
}: CreateGameOptions): GameState {
  if (players.length === 0) {
    throw new Error(
      "Une partie doit contenir au moins un joueur.",
    );
  }

  const playerIds = players.map((player) => player.id);

  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error(
      "Les identifiants des joueurs doivent être uniques.",
    );
  }

  return {
    id,
    mode,

    status: "setup",
    phase: "main",

    turnNumber: 1,
    activePlayerId: players[0].id,

    playerOrder: playerIds,

    players: Object.fromEntries(
      players.map((player) => [player.id, player]),
    ),

    cardDefinitions,
    cards: {},

    market: {
      deck: [],
      row: [],
      sacrificed: [],
    },

    master: null,
    minions: {},
    hazards: {},

    campaign: null,

    randomState: seed >>> 0,
    nextCardInstanceId: 1,
  };
}
