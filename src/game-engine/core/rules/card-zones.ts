import type { CardId } from "../types/common";
import type {
  PlayerState,
  PlayerZones,
} from "../types/player";

export type PlayerZone = keyof PlayerZones;

export function moveCard(
    player: PlayerState,
    cardId: CardId,
    from: PlayerZone,
    to: PlayerZone
): PlayerState {
    if (from === to) {
        throw new Error(
            "La zone source et la zone cible doivent être différentes.",
        );
    }

    if (!player.zones[from].includes(cardId)) {
        throw new Error(
            `La carte ${cardId} n'est pas dans la zone ${from}.`,
        );
    }

    if (player.zones[to].includes(cardId)) {
        throw new Error(
            `La carte ${cardId} est déjà dans la zone ${to}.`,
        );
    }

    return {
        ...player,
        zones: {
            ...player.zones,

            [from]: player.zones[from].filter(
                (id) => id !== cardId,
            ),

            [to]: [...player.zones[to], cardId],
        },
    };
}