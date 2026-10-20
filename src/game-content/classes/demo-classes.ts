import type {
  ClassRegistry,
} from "../../game-engine/core/types/character-class";

export const demoClasses: ClassRegistry = {
  cleric: {
    id: "cleric",
    name: "Clerc",
    description:
      "Personnage orienté vers le soutien et les soins.",
    startingStats: {
      maxHealth: 50,
      startingLevel: 1,
      startingExperience: 0,
    },
    startingDeck: [],
    startingSkillIds: [],
    startingAbilityIds: [],
  },

  fighter: {
    id: "fighter",
    name: "Guerrier",
    description:
      "Personnage orienté vers le combat et la résistance.",
    startingStats: {
      maxHealth: 50,
      startingLevel: 1,
      startingExperience: 0,
    },
    startingDeck: [],
    startingSkillIds: [],
    startingAbilityIds: [],
  },

  ranger: {
    id: "ranger",
    name: "Rôdeur",
    description:
      "Personnage orienté vers la précision et la polyvalence.",
    startingStats: {
      maxHealth: 50,
      startingLevel: 1,
      startingExperience: 0,
    },
    startingDeck: [],
    startingSkillIds: [],
    startingAbilityIds: [],
  },

  thief: {
    id: "thief",
    name: "Voleur",
    description:
      "Personnage orienté vers la mobilité et les opportunités.",
    startingStats: {
      maxHealth: 50,
      startingLevel: 1,
      startingExperience: 0,
    },
    startingDeck: [],
    startingSkillIds: [],
    startingAbilityIds: [],
  },

  wizard: {
    id: "wizard",
    name: "Magicien",
    description:
      "Personnage orienté vers les effets et les combinaisons.",
    startingStats: {
      maxHealth: 50,
      startingLevel: 1,
      startingExperience: 0,
    },
    startingDeck: [],
    startingSkillIds: [],
    startingAbilityIds: [],
  },
};
