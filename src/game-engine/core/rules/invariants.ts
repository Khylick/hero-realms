
import type { GameState } from "../types/game-state";
import type { CardId } from "../types/common";

export function validateGameState(
  game: GameState,
): string[] {
  const errors: string[] = [];
  const seenCards = new Set<CardId>();

  function registerCard(
    cardId: CardId,
    zone: string,
    expectedOwnerId?: string | null,
  ) {
    if (seenCards.has(cardId)) {
      errors.push(
        `La carte ${cardId} apparaît dans plusieurs zones (${zone}).`,
      );
    }

    seenCards.add(cardId);

    const card = game.cards[cardId];

    if (!card) {
      errors.push(
        `La carte ${cardId} n'existe pas dans le registre.`,
      );
      return;
    }

    if (
      expectedOwnerId !== undefined &&
      card.ownerId !== expectedOwnerId
    ) {
      errors.push(
        `La carte ${cardId} possède un propriétaire incorrect.`,
      );
    }
  }

  for (const player of Object.values(game.players)) {
    for (const [zoneName, cardIds] of Object.entries(
      player.zones,
    )) {
      for (const cardId of cardIds) {
        registerCard(
          cardId,
          `${player.id}.${zoneName}`,
          player.id,
        );
      }
    }
  }

  for (const cardId of game.market.deck) {
    registerCard(cardId, "market.deck", null);
  }

  for (const cardId of game.market.row) {
    registerCard(cardId, "market.row", null);
  }

  for (const cardId of game.market.sacrificed) {
    registerCard(cardId, "market.sacrificed", null);
  }

  if (game.master) {
    for (const cardId of game.master.deck) {
      registerCard(cardId, "master.deck");
    }

    for (const cardId of game.master.discard) {
      registerCard(cardId, "master.discard");
    }
  }

  for (const [cardId, card] of Object.entries(game.cards)) {
    if (card.id !== cardId) {
      errors.push(
        `Identifiant incohérent pour la carte ${cardId}.`,
      );
    }

    if (!game.cardDefinitions[card.definitionId]) {
      errors.push(
        `Définition inconnue pour la carte ${cardId}.`,
      );
    }

    if (!seenCards.has(cardId)) {
      errors.push(
        `La carte ${cardId} n'appartient à aucune zone.`,
      );
    }
  }

  return errors;
}
