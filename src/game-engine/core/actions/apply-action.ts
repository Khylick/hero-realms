import type { GameState } from "../types/game-state";
import type { GameAction } from "../types/game-action";

import { startGame, endTurn } from "../rules/turn";
import { playCard } from "../rules/play-card";
import { buyCard } from "../rules/market";
import { resolveChoice } from "../effects/effect-queue";
import { validateGameState } from "../rules/invariants";

import { activateAlly } from "../rules/alliances";

export function applyAction(
  game: GameState,
  action: GameAction,
): GameState {
  if (
    game.resolution.pendingChoice &&
    action.type !== "RESOLVE_CHOICE"
  ) {
    throw new Error(
      "Un choix doit être résolu avant toute autre action.",
    );
  }

  if (
    game.resolution.queue.length > 0 &&
    !game.resolution.pendingChoice
  ) {
    throw new Error(
      "La file d'effets doit être résolue.",
    );
  }

  let next: GameState;

  switch (action.type) {
    case "START_GAME":
      next = startGame(game);
      break;

    case "PLAY_CARD":
      next = playCard(
        game,
        action.playerId,
        action.cardId,
      );
      break;

    case "BUY_CARD":
      next = buyCard(
        game,
        action.playerId,
        action.cardId,
      );
      break;

    case "ACTIVATE_ALLY":
      next = activateAlly(
        game,
        action.playerId,
        action.cardId,
        action.abilityId,
      );
      break;

    case "END_TURN":
      next = endTurn(game, action.playerId);
      break;

    case "RESOLVE_CHOICE":
      next = resolveChoice(
        game,
        action.playerId,
        action.choiceId,
        action.selectedCardIds,
      );
      break;

    case "ATTACK_ENEMY":
    case "USE_CHAMPION":
      throw new Error(
        `Action non implémentée : ${action.type}`,
      );

    default: {
      const exhaustive: never = action;

      throw new Error(
        `Action inconnue : ${JSON.stringify(exhaustive)}`,
      );
    }
  }

  const errors = validateGameState(next);

  if (errors.length > 0) {
    throw new Error(
      `État de jeu invalide :\n${errors.join("\n")}`,
    );
  }

  return next;
}