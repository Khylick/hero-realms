import type { GameState } from "../types/game-state";
import type {
  CardId,
  Faction,
  PlayerId,
} from "../types/common";
import type { CardAbility } from "../types/ability";

import { enqueueEffects } from "../effects/effect-queue";

export function getActiveFactionCards(
  game: GameState,
  playerId: PlayerId,
): CardId[] {
  const player = game.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  return [
    ...player.zones.inPlay,
    ...player.zones.champions,
  ];
}

export function getCardFaction(
  game: GameState,
  cardId: CardId,
): Faction | null {
  const card = game.cards[cardId];

  if (!card) {
    throw new Error(`Carte introuvable : ${cardId}`);
  }

  const definition =
    game.cardDefinitions[card.definitionId];

  if (!definition) {
    throw new Error(
      `Définition introuvable : ${card.definitionId}`,
    );
  }

  return definition.faction ?? null;
}


export function hasAlly(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
): boolean {
  const faction = getCardFaction(game, cardId);

  if (!faction) {
    return false;
  }

  return getActiveFactionCards(game, playerId).some(
    (otherCardId) =>
      otherCardId !== cardId &&
      getCardFaction(game, otherCardId) === faction,
  );
}

export function canActivateAlly(
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

  if (
    !getActiveFactionCards(game, playerId).includes(
      cardId,
    )
  ) {
    return false;
  }

  const card = game.cards[cardId];

  if (!card || card.ownerId !== playerId) {
    return false;
  }

  const definition =
    game.cardDefinitions[card.definitionId];

  if (!definition) {
    return false;
  }

  const ability = definition.abilities.find(
    (item) => item.id === abilityId,
  );

  if (!ability || ability.trigger !== "ally") {
    return false;
  }

  if (card.usedAbilities.includes(abilityId)) {
    return false;
  }

  // Les conditions supplémentaires seront prises
  // en charge dans une prochaine évolution.
  if (ability.conditions?.length) {
    return false;
  }

  return hasAlly(game, playerId, cardId);
}


export interface AvailableAllyAbility {
  cardId: CardId;
  ability: CardAbility;
}

export function getAvailableAllyAbilities(
  game: GameState,
  playerId: PlayerId,
): AvailableAllyAbility[] {
  const result: AvailableAllyAbility[] = [];

  for (
    const cardId of getActiveFactionCards(
      game,
      playerId,
    )
  ) {
    const card = game.cards[cardId];

    if (!card) {
      continue;
    }

    const definition =
      game.cardDefinitions[card.definitionId];

    if (!definition) {
      continue;
    }

    for (const ability of definition.abilities) {
      if (
        canActivateAlly(
          game,
          playerId,
          cardId,
          ability.id,
        )
      ) {
        result.push({
          cardId,
          ability,
        });
      }
    }
  }

  return result;
}

export function activateAlly(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
  abilityId: string,
): GameState {
  if (
    !canActivateAlly(
      game,
      playerId,
      cardId,
      abilityId,
    )
  ) {
    throw new Error(
      "Cette capacité d'alliance n'est pas disponible.",
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

  // Marquer l'utilisation avant la résolution permet
  // d'éviter toute nouvelle activation pendant un choix.
  card.usedAbilities.push(abilityId);

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