import type { AbilityCondition } from "../types/ability";
import type { GameState } from "../types/game-state";
import type { PlayerId } from "../types/common";

export function areAbilityConditionsMet(
  game: GameState,
  playerId: PlayerId,
  conditions: AbilityCondition[] = [],
): boolean {
  const player = game.players[playerId];

  if (!player) {
    return false;
  }

  return conditions.every((condition) => {
    switch (condition.type) {
      case "hasFactionInPlay": {
        if (
          !Number.isSafeInteger(condition.minimum) ||
          condition.minimum < 0
        ) {
          throw new Error(
            "Le nombre minimal de cartes de faction est invalide.",
          );
        }

        const factionCount = [
          ...player.zones.inPlay,
          ...player.zones.champions,
        ].filter((cardId) => {
          const card = game.cards[cardId];
          return (
            card &&
            game.cardDefinitions[card.definitionId]?.faction ===
              condition.faction
          );
        }).length;

        return factionCount >= condition.minimum;
      }

      case "healthBelow":
        if (
          !Number.isSafeInteger(condition.amount) ||
          condition.amount < 0
        ) {
          throw new Error(
            "Le seuil de points de vie est invalide.",
          );
        }

        return player.health < condition.amount;

      case "hasChampionInPlay":
        if (
          !Number.isSafeInteger(condition.minimum) ||
          condition.minimum < 0
        ) {
          throw new Error(
            "Le nombre minimal de champions est invalide.",
          );
        }

        return player.zones.champions.length >= condition.minimum;

      default: {
        const exhaustive: never = condition;
        throw new Error(
          `Condition inconnue : ${JSON.stringify(exhaustive)}`,
        );
      }
    }
  });
}
