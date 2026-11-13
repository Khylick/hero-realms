import type { GameState } from "../types/game-state";

import {
  enqueuePlayAbilities,
} from "../effects/effect-queue";
import { moveCard } from "./card-zones";
import { areAbilityConditionsMet } from "./ability-conditions";

export function playCard(
  game: GameState,
  playerId: string,
  cardId: string,
): GameState {
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== playerId
  ) {
    throw new Error(
      "Impossible de jouer une carte maintenant.",
    );
  }

  if (game.resolution.pendingChoice) {
    throw new Error(
      "Un choix doit être résolu avant de jouer.",
    );
  }

  if (game.resolution.queue.length > 0) {
    throw new Error(
      "Une résolution d'effets est déjà en cours.",
    );
  }

  const next = structuredClone(game);
  const player = next.players[playerId];

  if (!player || player.defeated) {
    throw new Error("Joueur invalide.");
  }

  if (!player.zones.hand.includes(cardId)) {
    throw new Error(
      "Cette carte n'est pas dans la main.",
    );
  }

  const card = next.cards[cardId];

  if (!card || card.ownerId !== playerId) {
    throw new Error("Instance de carte invalide.");
  }

  const definition =
    next.cardDefinitions[card.definitionId];

  if (!definition) {
    throw new Error("Définition de carte inconnue.");
  }

  const destination =
    definition.type === "champion"
      ? "champions"
      : "inPlay";

  next.players[playerId] = moveCard(
    player,
    cardId,
    "hand",
    destination,
  );

  if (definition.type === "champion") {
    next.cards[cardId].exhausted = false;
    next.cards[cardId].usedAbilities = [];
  }

  const abilities = definition.abilities.filter(
    (ability) =>
      ability.trigger === "onPlay" &&
      areAbilityConditionsMet(
        next,
        playerId,
        ability.conditions,
      ),
  );

  return enqueuePlayAbilities(
    next,
    playerId,
    cardId,
    abilities,
  );
}