import type {
  ClassRegistry,
} from "../../game-engine/core/types/character-class";

const clericDeck = [
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "dagger",
  "dagger",
  "imperialScout",
  "royalGuard",
];

const fighterDeck = [
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "dagger",
  "dagger",
  "dagger",
  "runicBlade",
  "royalGuard",
];

const rangerDeck = [
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "dagger",
  "dagger",
  "imperialScout",
  "battleMage",
];

const thiefDeck = [
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "dagger",
  "dagger",
  "tacticalScroll",
  "imperialScout",
];

const wizardDeck = [
  "gold",
  "gold",
  "gold",
  "gold",
  "gold",
  "dagger",
  "dagger",
  "tacticalScroll",
  "battleMage",
  "arcaneGuardian",
];


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
    startingDeck: clericDeck,
    startingSkillIds: ["cleric-healing-prayer"],
    startingAbilityIds: ["cleric-divine-light"],
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
    startingDeck: fighterDeck,
    startingSkillIds: ["fighter-battle-stance"],
    startingAbilityIds: ["fighter-heroic-strike"],
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
    startingDeck: rangerDeck,
    startingSkillIds: ["ranger-precise-shot"],
    startingAbilityIds: ["ranger-tracking"],
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
    startingDeck: thiefDeck,
    startingSkillIds: ["thief-quick-hands"],
    startingAbilityIds: ["thief-shadow-strike"],
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
    startingDeck: wizardDeck,
    startingSkillIds: ["wizard-arcane-focus"],
    startingAbilityIds: ["wizard-arcane-surge"],
  },
};
