import type { GameState } from "../types/game-state";
import type { GameAction } from "../types/game-action";

import { startGame, endTurn } from "../rules/turn";
import { playCard } from "../rules/play-card";
import { buyCard } from "../rules/market";
import { validateGameState } from "../rules/invariants";

export function applyAction(
    game: GameState,
    action: GameAction,
): GameState {
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

        case "END_TURN":
            next = endTurn(game, action.playerId);
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