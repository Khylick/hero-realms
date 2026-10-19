import type { GameState } from "../types/game-state";
import type {
  CardId,
  PlayerId,
} from "../types/common";

import { enqueueEffects } from "../effects/effect-queue";
import { moveCard } from "./card-zones";

export function canActivateChampion(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
  abilityId: string,
): boolean {
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== playerId ||
    game.resolution.pendingChoice !== null ||
    game.resolution.queue.length > 0
  ) {
    return false;
  }

  const player = game.players[playerId];

  if (!player || player.defeated) {
    return false;
  }

  if (!player.zones.champions.includes(cardId)) {
    return false;
  }

  const card = game.cards[cardId];

  if (
    !card ||
    card.ownerId !== playerId ||
    card.exhausted
  ) {
    return false;
  }

  const definition =
    game.cardDefinitions[card.definitionId];

  if (!definition || definition.type !== "champion") {
    return false;
  }

  const ability = definition.abilities.find(
    (item) => item.id === abilityId,
  );

  if (!ability || ability.trigger !== "activated") {
    return false;
  }

  // Les conditions supplémentaires seront traitées
  // par notre futur évaluateur de conditions.
  if (ability.conditions?.length) {
    return false;
  }

  return true;
}

export function activateChampion(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
  abilityId: string,
): GameState {
  if (
    !canActivateChampion(
      game,
      playerId,
      cardId,
      abilityId,
    )
  ) {
    throw new Error(
      "Cette capacité de champion n'est pas disponible.",
    );
  }

  const next = structuredClone(game);

  const card = next.cards[cardId];
  const definition =
    next.cardDefinitions[card.definitionId];

  const ability = definition.abilities.find(
    (item) => item.id === abilityId,
  );

  if (!ability) {
    throw new Error("Capacité introuvable.");
  }

  // Le champion est épuisé avant la résolution.
  card.exhausted = true;

  return enqueueEffects(
    next,
    {
      playerId,
      sourceCardId: cardId,
      abilityId,
    },
    ability.effects,
  );
}

export function stunChampion(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
): GameState {
  const next = structuredClone(game);

  const player = next.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  if (!player.zones.champions.includes(cardId)) {
    throw new Error(
      "Cette carte n'est pas un champion en jeu.",
    );
  }

  const card = next.cards[cardId];

  if (!card || card.ownerId !== playerId) {
    throw new Error("Champion invalide.");
  }

  const definition =
    next.cardDefinitions[card.definitionId];

  if (!definition || definition.type !== "champion") {
    throw new Error("La carte n'est pas un champion.");
  }

  next.players[playerId] = moveCard(
    player,
    cardId,
    "champions",
    "discard",
  );

  card.exhausted = false;
  card.usedAbilities = [];

  return next;
}

export function readyChampions(
  game: GameState,
  playerId: PlayerId,
): GameState {
  const next = structuredClone(game);
  const player = next.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  for (const cardId of player.zones.champions) {
    const card = next.cards[cardId];

    if (!card) {
      throw new Error(
        `Champion introuvable : ${cardId}`,
      );
    }

    card.exhausted = false;

    // Les alliances des champions peuvent être
    // utilisées à nouveau lors du nouveau tour.
    card.usedAbilities = [];
  }

  return next;
}
