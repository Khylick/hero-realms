import type { CardDefinition } from "../../game-engine/core/types/card";

export const demoCards: Record<string, CardDefinition> = {
    gold: {
        id: "gold",
        name: "Pièce d'or",
        type: "item",
        cost: 0,
        primaryEffects: [
            {
                effects: [
                    {
                        type: "gainGold",
                        amount: 1
                    },
                ],
            },
        ],
    },

    dagger: {
        id: "dagger",
        name: "Dague",
        type: "item",
        cost: 0,
        primaryEffects: [
            {
                effects: [
                    {
                        type: "gainCombat",
                        amount: 1
                    },
                ],
            },
        ],
    },

    runicBlade: {
        id: "runicBlade",
        name: "Lame runique",
        type: "item",
        faction: "imperial",
        cost: 3,
        primaryEffects: [
            {
                effects: [
                    {
                        type: "gainCombat",
                        amount: 3,
                    },
                ],
            },
        ],
        allyEffects: [
            {
                effects: [
                    {
                        type: "drawCards",
                        amount: 1,
                    },
                ],
            },
        ],
    },
};