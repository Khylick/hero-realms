
import type {
  PlayerState,
} from "../types/player";

import type {
  HeroProfile,
} from "../types/hero-profile";

export function updateHeroProfile(
  profile: HeroProfile,
  player: PlayerState,
): HeroProfile {
  if (profile.id !== player.id) {
    throw new Error(
      "Le profil et le joueur ne correspondent pas.",
    );
  }

  if (profile.characterClass !== player.characterClass) {
    throw new Error(
      "La classe du héros ne correspond pas au profil.",
    );
  }

  if (
    !Number.isSafeInteger(player.experience) ||
    player.experience < 0
  ) {
    throw new Error(
      "L'expérience du joueur est invalide.",
    );
  }

  if (
    !Number.isSafeInteger(player.level) ||
    player.level < 1
  ) {
    throw new Error(
      "Le niveau du joueur est invalide.",
    );
  }

  return {
    ...profile,
    experience: player.experience,
    level: player.level,
  };
}
