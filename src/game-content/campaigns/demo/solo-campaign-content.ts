import type { CampaignContent, MasterLevel } from "../../../game-engine/core";

const firstLevel: MasterLevel = {
  cardsPerTurn: 1,
  masteryThreshold: 3,
  favoredFaction: "necros",
  abilities: {
    imperial: [{ type: "healMaster", amount: 2 }],
    guild: [{ type: "gainCombat", amount: 1 }],
    necros: [{ type: "gainCombat", amount: 2 }],
    wild: [{ type: "discardHero", amount: 1 }],
  },
};

/** Fictional encounter for validating the campaign loop, not an official scenario. */
export const soloCampaignContent: CampaignContent = {
  masters: {
    "shadow-lord": {
      id: "shadow-lord",
      name: "Seigneur des Ombres",
      description: "Le gardien d'un autel oublié.",
      maxHealth: 40,
      attack: 0,
      behaviorIds: [],
      levels: [
        firstLevel,
        {
          ...firstLevel,
          cardsPerTurn: 2,
          favoredFaction: "guild",
          abilities: {
            ...firstLevel.abilities,
            guild: [{ type: "gainCombat", amount: 2 }],
          },
        },
      ],
    },
  },
  minions: {
    skeleton: {
      id: "skeleton",
      name: "Sentinelle d'os",
      description: "Un garde de l'autel.",
      maxHealth: 4,
      attack: 1,
      isGuard: true,
      behaviorIds: [],
    },
    cultist: {
      id: "cultist",
      name: "Adepte des ombres",
      description: "Un serviteur du Maître.",
      maxHealth: 3,
      attack: 2,
      isGuard: false,
      behaviorIds: [],
    },
    wraith: {
      id: "wraith",
      name: "Spectre ancien",
      description: "Un sbire élite qui reste auprès du Maître.",
      maxHealth: 5,
      attack: 2,
      isGuard: false,
      behaviorIds: [],
    },
  },
  hazards: {
    curse: {
      id: "curse",
      name: "Malédiction de l'autel",
      description:
        "Subissez 1 dégât direct au début de chaque étape du Maître. Dissipez pour 2 or.",
      trigger: "onMasterTurnStart",
      duration: null,
      effectIds: [],
      effects: [{ type: "damageHero", amount: 1 }],
      clearCost: { resource: "gold", amount: 2 },
    },
  },
  masterCards: {
    bones: {
      id: "bones",
      name: "La garde se relève",
      faction: "imperial",
      kind: "minion",
      definitionId: "skeleton",
    },
    ritualist: {
      id: "ritualist",
      name: "Appel du culte",
      faction: "necros",
      kind: "minion",
      definitionId: "cultist",
    },
    elite: {
      id: "elite",
      name: "L'ancien s'éveille",
      faction: "guild",
      kind: "minion",
      definitionId: "wraith",
      elite: true,
    },
    curse: {
      id: "curse",
      name: "L'autel murmure",
      faction: "wild",
      kind: "hazard",
      definitionId: "curse",
    },
    strike: {
      id: "strike",
      name: "Onde obscure",
      faction: "guild",
      kind: "action",
      effects: [{ type: "gainCombat", amount: 2 }],
    },
    mastery: { id: "mastery", name: "Maîtrise des ombres", kind: "mastery" },
  },
  encounters: {
    "shadow-altar": {
      id: "shadow-altar",
      name: "L'Autel des Ombres",
      description:
        "Brisez les défenses de l'autel et réduisez la santé du Maître à zéro.",
      masterDefinitionId: "shadow-lord",
      minions: [],
      hazardDefinitionIds: [],
      masterDeck: [
        "bones",
        "bones",
        "ritualist",
        "ritualist",
        "elite",
        "curse",
        "strike",
        "strike",
        "strike",
        "strike",
        "mastery",
        "mastery",
        "mastery",
        "mastery",
        "mastery",
      ],
    },
  },
};
