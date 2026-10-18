import type { CardDefinition } from
  "../../game-engine/core/types/card";

export const demoCards: Record<string, CardDefinition> = {
  gold: {
    id: "gold",
    name: "Pièce d'or",
    type: "item",
    cost: 0,
    abilities: [
      {
        id: "gold-primary",
        trigger: "onPlay",
        effects: [
          {
            type: "gainGold",
            amount: 1,
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
    abilities: [
      {
        id: "dagger-primary",
        trigger: "onPlay",
        effects: [
          {
            type: "gainCombat",
            amount: 1,
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
    abilities: [
      {
        id: "runic-blade-primary",
        trigger: "onPlay",
        effects: [
          {
            type: "gainCombat",
            amount: 3,
          },
        ],
      },
      {
        id: "runic-blade-ally",
        trigger: "ally",
        effects: [
          {
            type: "drawCards",
            amount: 1,
          },
        ],
      },
    ],
  },

  royalGuard: {
    id: "royalGuard",
    name: "Garde royal",
    type: "champion",
    faction: "imperial",
    cost: 4,
    defense: 4,
    isGuard: true,
    abilities: [
      {
        id: "royal-guard-ability",
        trigger: "activated",
        oncePerTurn: true,
        effects: [
          {
            type: "gainCombat",
            amount: 2,
          },
        ],
      },
    ],
  },
};