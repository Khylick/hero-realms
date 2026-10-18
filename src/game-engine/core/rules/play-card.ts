import type { GameState } from "../types/game-state";

import { resolveSimpleEffect } from "../effects/resolve-effects";
import { moveCard } from "./card-zones";

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

  if (definition.type === "champion") {
    throw new Error(
      "Les champions ne sont pas encore pris en charge.",
    );
  }

  const onPlayAbilities = definition.abilities.filter(
    (ability) => ability.trigger === "onPlay",
  );

  for (const ability of onPlayAbilities) {
    if (
      ability.optional ||
      ability.conditions?.length
    ) {
      throw new Error(
        "Cette capacité nécessite le moteur avancé.",
      );
    }
  }

  let updatedPlayer = player;

  for (const ability of onPlayAbilities) {
    for (const effect of ability.effects) {
      updatedPlayer = resolveSimpleEffect(
        updatedPlayer,
        effect,
      );
    }
  }

  next.players[playerId] = moveCard(
    updatedPlayer,
    cardId,
    "hand",
    "inPlay",
  );

  return next;
}