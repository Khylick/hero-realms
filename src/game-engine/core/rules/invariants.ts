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

  // Vérifier les ressources et les points de vie
  for (const player of Object.values(game.players)) {
    for (const resource of ["gold", "combat"] as const) {
      const value = player.resources[resource];

      if (!Number.isSafeInteger(value) || value < 0) {
        errors.push(
          `Ressource invalide : ${player.id}.${resource}`,
        );
      }
    }

    if (
      !Number.isSafeInteger(player.health) ||
      player.health < 0 ||
      player.health > player.maxHealth
    ) {
      errors.push(
        `Points de vie invalides : ${player.id}`,
      );
    }

    if (player.defeated !== (player.health === 0)) {
      errors.push(
        `État de défaite incohérent : ${player.id}`,
      );
    }
  }
  
  // Vérifier la résolution en attente.
  const choice = game.resolution.pendingChoice;

  if (choice) {
    const player = game.players[choice.playerId];

    if (!player) {
      errors.push(
        "Le choix appartient à un joueur inconnu.",
      );
    } else {
      if (
        !Number.isSafeInteger(choice.amount) ||
        choice.amount < 1
      ) {
        errors.push(
          "Nombre de cartes du choix invalide."
        );
      }

      if (
        new Set(choice.availableCardIds).size !==
        choice.availableCardIds.length
      ) {
        errors.push(
          "Le choix contient des cartes dupliquées.",
        );
      }

      for (const cardId of choice.availableCardIds) {
        if (!player.zones[choice.from].includes(cardId)) {
          errors.push(
            `Carte indisponible dans le choix : ${cardId}`,
          );
        }
      }
      
    }
  }
  



  return errors;
}
