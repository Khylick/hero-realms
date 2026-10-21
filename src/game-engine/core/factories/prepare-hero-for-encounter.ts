
import type {
  CardDefinition,
} from "../types/card";

import type {
  ClassDefinition,
} from "../types/character-class";

import type {
  CharacterPowerRegistry,
} from "../types/character-power";

import type {
  ClassProgressionDefinition,
} from "../types/character-progression";

import type {
  HeroProfile,
} from "../types/hero-profile";

import type { RandomGenerator } from "../utils/random";

import {
  createClassHero,
  type CreatedClassHero,
} from "./create-class-hero";

import {
  buildCustomizedDeck,
} from "../rules/build-customized-deck";

import {
  getLevelForExperience,
} from "../rules/character-progression";

export interface PrepareHeroForEncounterOptions {
  profile: HeroProfile;

  classDefinition: ClassDefinition;

  progression: ClassProgressionDefinition;

  cardDefinitions: Record<string, CardDefinition>;

  powerDefinitions: CharacterPowerRegistry;

  random: RandomGenerator;
}

export function prepareHeroForEncounter({
  profile,
  classDefinition,
  progression,
  cardDefinitions,
  powerDefinitions,
  random,
}: PrepareHeroForEncounterOptions): CreatedClassHero {
  // 1. Vérifier la cohérence des classes.
  if (
    profile.characterClass !== classDefinition.id ||
    profile.characterClass !== progression.characterClass
  ) {
    throw new Error(
      "La classe du profil ne correspond pas aux définitions.",
    );
  }

  // 2. Déterminer le niveau selon l'expérience.
  const level = getLevelForExperience(
    progression,
    profile.experience,
  );

  if (profile.level !== level.level) {
    throw new Error(
      "Le niveau du profil ne correspond pas à son expérience.",
    );
  }

  // 3. Construire le deck personnalisé.
  const startingDeck = buildCustomizedDeck(
    classDefinition.startingDeck,
    profile.customization,
  );

  // 4. Construire la liste des pouvoirs.
  const availablePowerIds = [
    ...classDefinition.startingSkillIds,
    ...classDefinition.startingAbilityIds,
  ];

  // Ajouter les pouvoirs débloqués par progression.
  for (const levelDefinition of progression.levels) {
    if (levelDefinition.level > profile.level) {
      break;
    }

    availablePowerIds.push(
      ...levelDefinition.unlockedPowerIds,
    );
  }

  // Ajouter les pouvoirs sélectionnés.
  availablePowerIds.push(
    ...profile.customization.selectedPowerIds,
  );

  const uniquePowerIds = [
    ...new Set(availablePowerIds),
  ];

  // Vérifier que les pouvoirs existent.
  for (const powerId of uniquePowerIds) {
    if (!powerDefinitions[powerId]) {
      throw new Error(
        `Pouvoir inconnu : ${powerId}`,
      );
    }
  }

  // 5. Reconstituer les caractéristiques.
  const maxHealthBonus = progression.levels
    .filter((entry) => entry.level <= profile.level)
    .reduce(
      (total, entry) => total + entry.maxHealthBonus,
      0,
    );

  const maxHealth =
    classDefinition.startingStats.maxHealth +
    maxHealthBonus;

  // 6. Préparer une définition de classe adaptée.
  const preparedClassDefinition: ClassDefinition = {
    ...classDefinition,
    startingStats: {
      ...classDefinition.startingStats,
      maxHealth,
      startingLevel: profile.level,
      startingExperience: profile.experience,
    },
    startingDeck,
  };

  // 7. Créer le héros et ses instances de cartes.
  const hero = createClassHero({
    id: profile.id,
    name: profile.name,
    classDefinition: preparedClassDefinition,
    cardDefinitions,
    random,
  });

  // 8. Attribuer les pouvoirs disponibles.
  hero.player.powers.availablePowerIds =
    uniquePowerIds;

  // 9. Réinitialiser les utilisations temporaires.
  hero.player.powers.usedThisTurn = [];
  hero.player.powers.usedThisEncounter = [];

  return hero;
}
