import type { CardEffect } from "../types/effect";
import type { PlayerState } from "../types/player";

import {
  gainResource,
  healPlayer,
} from "../rules/resources";

export function resolveSimpleEffect(
    player: PlayerState,
    effect: CardEffect,
): PlayerState {
    switch (effect.type) {
        case "gainGold":
            return gainResource(
                player,
                "gold",
                effect.amount,
            );

        case "gainCombat":
            return gainResource(
                player,
                "combat",
                effect.amount,
            );

        case "heal":
            if (effect.target !== "self") {
                throw new Error(
                    "Seuls les soins personnels sont pris en charge.",
                );
            }

            return healPlayer(player, effect.amount);

        default:
            throw new Error(
                `Effet non pris en charge : ${effect.type}`,
            );
    }
}