
import type {
  CharacterPowerRegistry,
} from "../../game-engine/core/types/character-power";

export const demoPowers: CharacterPowerRegistry = {
  "cleric-healing-prayer": {
    id: "cleric-healing-prayer",
    name: "Prière de soin",
    description: "Rend 3 points de vie.",
    kind: "skill",
    usage: "oncePerTurn",
    cost: { type: "none" },
    effects: [
      {
        type: "heal",
        amount: 3,
        target: "self",
      },
    ],
  },

  "cleric-divine-light": {
    id: "cleric-divine-light",
    name: "Lumière divine",
    description: "Rend 10 points de vie.",
    kind: "ability",
    usage: "oncePerEncounter",
    cost: { type: "none" },
    effects: [
      {
        type: "heal",
        amount: 10,
        target: "self",
      },
    ],
  },

  "fighter-battle-stance": {
    id: "fighter-battle-stance",
    name: "Posture de combat",
    description: "Gagne 2 points de combat.",
    kind: "skill",
    usage: "oncePerTurn",
    cost: { type: "none" },
    effects: [
      {
        type: "gainCombat",
        amount: 2,
      },
    ],
  },

  "fighter-heroic-strike": {
    id: "fighter-heroic-strike",
    name: "Frappe héroïque",
    description: "Gagne 8 points de combat.",
    kind: "ability",
    usage: "oncePerEncounter",
    cost: { type: "none" },
    effects: [
      {
        type: "gainCombat",
        amount: 8,
      },
    ],
  },

  "ranger-precise-shot": {
    id: "ranger-precise-shot",
    name: "Tir précis",
    description: "Gagne 2 points de combat.",
    kind: "skill",
    usage: "oncePerTurn",
    cost: { type: "none" },
    effects: [
      {
        type: "gainCombat",
        amount: 2,
      },
    ],
  },

  "ranger-tracking": {
    id: "ranger-tracking",
    name: "Pistage",
    description: "Pioche 2 cartes.",
    kind: "ability",
    usage: "oncePerEncounter",
    cost: { type: "none" },
    effects: [
      {
        type: "drawCards",
        amount: 2,
      },
    ],
  },

  "thief-quick-hands": {
    id: "thief-quick-hands",
    name: "Mains agiles",
    description: "Gagne 2 pièces d'or.",
    kind: "skill",
    usage: "oncePerTurn",
    cost: { type: "none" },
    effects: [
      {
        type: "gainGold",
        amount: 2,
      },
    ],
  },

  "thief-shadow-strike": {
    id: "thief-shadow-strike",
    name: "Frappe des ombres",
    description: "Gagne 6 points de combat.",
    kind: "ability",
    usage: "oncePerEncounter",
    cost: { type: "none" },
    effects: [
      {
        type: "gainCombat",
        amount: 6,
      },
    ],
  },

  "wizard-arcane-focus": {
    id: "wizard-arcane-focus",
    name: "Concentration arcanique",
    description: "Gagne 1 pièce d'or.",
    kind: "skill",
    usage: "oncePerTurn",
    cost: { type: "none" },
    effects: [
      {
        type: "gainGold",
        amount: 1,
      },
    ],
  },

  "wizard-arcane-surge": {
    id: "wizard-arcane-surge",
    name: "Déferlement arcanique",
    description: "Pioche 3 cartes.",
    kind: "ability",
    usage: "oncePerEncounter",
    cost: { type: "none" },
    effects: [
      {
        type: "drawCards",
        amount: 3,
      },
    ],
  },
};
