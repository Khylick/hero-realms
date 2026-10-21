
import type {
  HeroCustomization,
  HeroProfile,
} from "../types/hero-profile";

export function customizeHero(
  profile: HeroProfile,
  customization: HeroCustomization,
): HeroProfile {
  const additionalCardIds = [
    ...customization.additionalCardIds,
  ];

  const removedCardIds = [
    ...customization.removedCardIds,
  ];

  const selectedPowerIds = [
    ...customization.selectedPowerIds,
  ];

  for (const id of [
    ...additionalCardIds,
    ...removedCardIds,
    ...selectedPowerIds,
  ]) {
    if (!id.trim()) {
      throw new Error(
        "Un identifiant de personnalisation est vide.",
      );
    }
  }

  if (
    new Set(selectedPowerIds).size !==
    selectedPowerIds.length
  ) {
    throw new Error(
      "Un pouvoir ne peut pas être sélectionné deux fois.",
    );
  }

  return {
    ...profile,
    customization: {
      additionalCardIds,
      removedCardIds,
      selectedPowerIds,
    },
  };
}
