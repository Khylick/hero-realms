import type { GameState } from "../types/game-state";
import type {
  EffectContext,
  QueuedEffect,
} from "../types/resolution";
import type { CardEffect } from "../types/effect";

import { drawCards } from "../rules/deck";
import { moveCard } from "../rules/card-zones";
import { resolveSimpleEffect } from "./resolve-effects";
import { createSeededRandom } from "../utils/random";

export function enqueueEffects(
  game: GameState,
  context: EffectContext,
  effects: CardEffect[],
): GameState {
  if (game.resolution.pendingChoice) {
    throw new Error(
      "Impossible d'ajouter des effets pendant un choix.",
    );
  }

  const next = structuredClone(game);

  const queued: QueuedEffect[] = effects.map(
    (effect) => ({
      context,
      effect,
    }),
  );

  next.resolution.queue.push(...queued);

  return processEffectQueue(next);
}

export function processEffectQueue(
  game: GameState,
): GameState {
  const next = structuredClone(game);

  if (next.resolution.pendingChoice) {
    return next;
  }

  while (next.resolution.queue.length > 0) {
    const queued = next.resolution.queue.shift();

    if (!queued) {
      break;
    }

    const { context, effect } = queued;

    const player = next.players[context.playerId];

    if (!player) {
      throw new Error("Joueur de l'effet introuvable.");
    }

    switch (effect.type) {
      case "gainGold":
      case "gainCombat":
      case "heal": {
        next.players[context.playerId] =
          resolveSimpleEffect(player, effect);
        break;
      }

      case "drawCards": {
        const random = createSeededRandom(
          next.randomState,
        );

        next.players[context.playerId] = drawCards(
          player,
          effect.amount,
          random,
        );

        next.randomState = random.getState();
        break;
      }

      case "chooseCard": {
        if (
          effect.from === "discard" &&
          effect.action === "discard"
        ) {
          throw new Error(
            "Impossible de défausser une carte déjà défaussée.",
          );
        }

        if (
          !Number.isSafeInteger(effect.amount) ||
          effect.amount < 1
        ) {
          throw new Error(
            "Nombre de cartes à choisir invalide.",
          );
        }

        const availableCardIds = [
          ...player.zones[effect.from],
        ];

        // Si aucune carte ne peut être choisie,
        // l'effet est ignoré dans notre MVP.
        if (availableCardIds.length === 0) {
          break;
        }

        const amount = Math.min(
          effect.amount,
          availableCardIds.length,
        );

        next.resolution.pendingChoice = {
          id: `choice-${next.resolution.nextChoiceId++}`,
          playerId: context.playerId,
          type: "selectCards",
          from: effect.from,
          action: effect.action,
          amount,
          availableCardIds,
        };

        return next;
      }

      default:
        throw new Error(
          `Effet non implémenté : ${effect.type}`,
        );
    }
  }

  return next;
}

export function resolveChoice(
  game: GameState,
  playerId: string,
  choiceId: string,
  selectedCardIds: string[],
): GameState {
  if (
    game.status !== "playing" ||
    game.phase !== "main"
  ) {
    throw new Error(
      "impossible de résoudre un choix hors de la phase principale.",
    );
  }

  const choice = game.resolution.pendingChoice;

  if (!choice) {
    throw new Error("Aucun choix en attente.");
  }

  if (choice.id !== choiceId) {
    throw new Error("Identifiant de choix invalide.");
  }

  if (choice.playerId !== playerId) {
    throw new Error(
      "Ce choix appartient à un autre joueur.",
    );
  }

  if (selectedCardIds.length !== choice.amount) {
    throw new Error(
      `Il faut sélectionner ${choice.amount} carte(s).`,
    );
  }

  if (
    new Set(selectedCardIds).size !==
    selectedCardIds.length
  ) {
    throw new Error(
      "Une carte ne peut pas être sélectionnée deux fois.",
    );
  }

  const next = structuredClone(game);
  let player = next.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  for (const cardId of selectedCardIds) {
    if (
      !choice.availableCardIds.includes(cardId) ||
      !player.zones[choice.from].includes(cardId)
    ) {
      throw new Error(
        `Carte non autorisée pour ce choix : ${cardId}`,
      );
    }

    player = moveCard(
      player,
      cardId,
      choice.from,
      choice.action === "discard"
        ? "discard"
        : "sacrificed",
    );
  }

  next.players[playerId] = player;
  next.resolution.pendingChoice = null;

  return processEffectQueue(next);
}