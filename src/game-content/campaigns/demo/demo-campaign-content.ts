import type {
  CampaignContent,
} from "../../../game-engine/core/types/campaign-content";

export const demoCampaignContent: CampaignContent = {
  masters: {
    "shadow-lord": {
      id: "shadow-lord",
      name: "Seigneur des Ombres",
      description:
        "Un puissant adversaire manipulant les ténèbres.",
      maxHealth: 40,
      attack: 5,
      behaviorIds: [
        "shadow-strike",
        "summon-minion",
      ],
    },
  },

  minions: {
    "skeleton-warrior": {
      id: "skeleton-warrior",
      name: "Guerrier squelette",
      description:
        "Un combattant mort-vivant.",
      maxHealth: 6,
      attack: 2,
      isGuard: true,
      behaviorIds: [
        "basic-attack",
      ],
    },

    "dark-cultist": {
      id: "dark-cultist",
      name: "Cultiste des ténèbres",
      description:
        "Un serviteur des forces obscures.",
      maxHealth: 4,
      attack: 3,
      isGuard: false,
      behaviorIds: [
        "basic-attack",
      ],
    },
  },

  hazards: {
    "cursed-altar": {
      id: "cursed-altar",
      name: "Autel maudit",
      description:
        "Une source de magie maléfique.",
      trigger: "onMasterTurnStart",
      duration: null,
      effectIds: [
        "altar-curse",
      ],
    },
  },

  encounters: {
    "shadow-lord-encounter": {
      id: "shadow-lord-encounter",
      name: "L'Autel des Ombres",
      description:
        "Les héros affrontent un seigneur des ténèbres.",

      masterDefinitionId: "shadow-lord",

      minions: [
        {
          definitionId: "skeleton-warrior",
          count: 2,
        },
        {
          definitionId: "dark-cultist",
          count: 1,
        },
      ],

      hazardDefinitionIds: [
        "cursed-altar",
      ],
    },
  },
};