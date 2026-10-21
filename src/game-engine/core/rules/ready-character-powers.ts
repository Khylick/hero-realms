import type {
  GameState,
} from "../types/game-state";

import type {
  PlayerId,
} from "../types/common";

export function readyCharacterPowers(
  game: GameState,
  playerId: PlayerId,
): GameState {
  const next = structuredClone(game);

  const player = next.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  player.powers.usedThisTurn = [];

  return next;
}