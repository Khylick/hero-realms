import type {
  ClassProgressionRegistry,
} from "../../game-engine/core/types/character-progression";

export const demoProgressions: ClassProgressionRegistry = {
  cleric: {
    characterClass: "cleric",
    levels: [
      {
        level: 1,
        requiredExperience: 0,
        maxHealthBonus: 0,
        unlockedPowerIds: [],
      },
      {
        level: 2,
        requiredExperience: 10,
        maxHealthBonus: 5,
        unlockedPowerIds: ["cleric-greater-healing"],
      },
      {
        level: 3,
        requiredExperience: 25,
        maxHealthBonus: 5,
        unlockedPowerIds: [],
      },
    ],
  },

  fighter: {
    characterClass: "fighter",
    levels: [
      {
        level: 1,
        requiredExperience: 0,
        maxHealthBonus: 0,
        unlockedPowerIds: [],
      },
      {
        level: 2,
        requiredExperience: 10,
        maxHealthBonus: 5,
        unlockedPowerIds: ["fighter-battle-cry"],
      },
      {
        level: 3,
        requiredExperience: 25,
        maxHealthBonus: 5,
        unlockedPowerIds: [],
      },
    ],
  },

  ranger: {
    characterClass: "ranger",
    levels: [
      {
        level: 1,
        requiredExperience: 0,
        maxHealthBonus: 0,
        unlockedPowerIds: [],
      },
      {
        level: 2,
        requiredExperience: 10,
        maxHealthBonus: 5,
        unlockedPowerIds: ["ranger-eagle-eye"],
      },
      {
        level: 3,
        requiredExperience: 25,
        maxHealthBonus: 5,
        unlockedPowerIds: [],
      },
    ],
  },

  thief: {
    characterClass: "thief",
    levels: [
      {
        level: 1,
        requiredExperience: 0,
        maxHealthBonus: 0,
        unlockedPowerIds: [],
      },
      {
        level: 2,
        requiredExperience: 10,
        maxHealthBonus: 5,
        unlockedPowerIds: ["thief-hidden-blade"],
      },
      {
        level: 3,
        requiredExperience: 25,
        maxHealthBonus: 5,
        unlockedPowerIds: [],
      },
    ],
  },

  wizard: {
    characterClass: "wizard",
    levels: [
      {
        level: 1,
        requiredExperience: 0,
        maxHealthBonus: 0,
        unlockedPowerIds: [],
      },
      {
        level: 2,
        requiredExperience: 10,
        maxHealthBonus: 5,
        unlockedPowerIds: ["wizard-mana-flow"],
      },
      {
        level: 3,
        requiredExperience: 25,
        maxHealthBonus: 5,
        unlockedPowerIds: [],
      },
    ],
  },
};
