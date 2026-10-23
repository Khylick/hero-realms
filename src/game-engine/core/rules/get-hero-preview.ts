import type {
  HeroProfile,
} from "../types/hero-profile";

import type {
  HeroGameContent,
} from "../types/hero-game-content";

import {
  buildCustomizedDeck,
} from "./build-customized-deck";

import {
  getLevelForExperience,
} from "./character-progression";

export interface HeroPreview {
  id: string;
  name: string;
  className: string;

  level: number;
  experience: number;

  maxHealth: number;
  deckSize: number;

  availablePowerIds: string[];
}

export function getHeroPreview(
  profile: HeroProfile,
  content: HeroGameContent,
): HeroPreview {
  const classDefinition =
    content.classDefinitions[profile.characterClass];

  const progression =
    content.classProgressions[profile.characterClass];

  if (!classDefinition || !progression) {
    throw new Error(
      "Classe ou progression introuvable.",
    );
  }

  const level = getLevelForExperience(
    progression,
    profile.experience,
  );

  if (level.level !== profile.level) {
    throw new Error(
      "Le niveau du profil ne correspond pas à son expérience.",
    );
  }

  const maxHealthBonus = progression.levels
    .filter((entry) => entry.level <= profile.level)
    .reduce(
      (total, entry) => total + entry.maxHealthBonus,
      0,
    );

  const deck = buildCustomizedDeck(
    classDefinition.startingDeck,
    profile.customization,
  );

  const availablePowerIds = [
    ...classDefinition.startingSkillIds,
    ...classDefinition.startingAbilityIds,
    ...progression.levels
      .filter((entry) => entry.level <= profile.level)
      .flatMap((entry) => entry.unlockedPowerIds),
    ...profile.customization.selectedPowerIds,
  ];

  return {
    id: profile.id,
    name: profile.name,
    className: classDefinition.name,

    level: profile.level,
    experience: profile.experience,

    maxHealth:
      classDefinition.startingStats.maxHealth +
      maxHealthBonus,

    deckSize: deck.length,

    availablePowerIds: [
      ...new Set(availablePowerIds),
    ],
  };
}