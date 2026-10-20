import type { GameState } from "../types/game-state";
import type {
  CardId,
  PlayerId,
} from "../types/common";

export function getGuardCards(
  game: GameState,
  targetPlayerId: PlayerId,
): CardId[] {
  const player = game.players[targetPlayerId];

  if (!player) {
    throw new Error("Joueur ciblé introuvable.");
  }

  return player.zones.champions.filter((cardId) => {
    const card = game.cards[cardId];

    if (!card) {
      throw new Error(
        `Champion introuvable : ${cardId}`,
      );
    }

    const definition =
      game.cardDefinitions[card.definitionId];

    if (!definition) {
      throw new Error(
        `Définition introuvable : ${card.definitionId}`,
      );
    }

    return definition.isGuard === true;
  });
}

export function hasGuard(
  game: GameState,
  targetPlayerId: PlayerId,
): boolean {
  return getGuardCards(
    game,
    targetPlayerId,
  ).length > 0;
}

export function canTargetChampion(
  game: GameState,
  targetPlayerId: PlayerId,
  cardId: CardId,
): boolean {
  const player = game.players[targetPlayerId];

  if (!player) {
    return false;
  }

  if (!player.zones.champions.includes(cardId)) {
    return false;
  }

  const card = game.cards[cardId];

  if (!card || card.ownerId !== targetPlayerId) {
    return false;
  }

  const definition =
    game.cardDefinitions[card.definitionId];

  if (!definition || definition.type !== "champion") {
    return false;
  }

  if (definition.isGuard) {
    return true;
  }

  return !hasGuard(game, targetPlayerId);
}

export function canTargetPlayer(
  game: GameState,
  targetPlayerId: PlayerId,
): boolean {
  const player = game.players[targetPlayerId];

  if (!player || player.defeated) {
    return false;
  }

  return !hasGuard(game, targetPlayerId);
}