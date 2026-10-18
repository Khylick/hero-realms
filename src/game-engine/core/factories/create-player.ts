import type {
  PlayerClass,
  PlayerId,
} from "../types/common";

import type { PlayerState } from "../types/player";

interface CreatePlayerOptions {
    id: PlayerId;
    name: string;
    characterClass: PlayerClass;
    maxHealth?: number;
}

export function createPlayer({
    id,
    name,
    characterClass,
    maxHealth = 50,
}: CreatePlayerOptions): PlayerState {
    return {
        id,
        name,
        characterClass,

        health: maxHealth,
        maxHealth,

        resources: {
            gold: 0,
            combat: 0
        },

        zones: {
            deck: [],
            hand: [],
            discard: [],
            inPlay: [],
            champions: [],
            sacrificed: [],
        },

        experience: 0,
        level: 1,

        defeated: false,
    };
}