import type { GameState } from "../types/game-state";
import { areAbilityConditionsMet } from "./ability-conditions";
import { enqueueEffects } from "../effects/effect-queue";
import { moveCard } from "./card-zones";

/** Sacrifice as a cost; other removal effects never trigger this ability. */
export function sacrificeInPlayCard(
  game: GameState,
  playerId: string,
  cardId: string,
  abilityId: string,
): GameState {
  const player = game.players[playerId];
  const card = game.cards[cardId];
  const ability =
    card &&
    game.cardDefinitions[card.definitionId]?.abilities.find(
      (item) => item.id === abilityId,
    );
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== playerId ||
    game.resolution.pendingChoice ||
    game.resolution.queue.length ||
    game.campaignEncounter?.pendingChoice ||
    !player ||
    player.defeated ||
    card?.ownerId !== playerId ||
    ability?.trigger !== "onSacrifice" ||
    !areAbilityConditionsMet(game, playerId, ability.conditions)
  ) {
    throw new Error("Cette capacité de sacrifice n'est pas disponible.");
  }
  const from = player.zones.inPlay.includes(cardId) ? "inPlay" : "champions";
  if (!player.zones[from].includes(cardId))
    throw new Error("La carte doit être en jeu.");
  const next = structuredClone(game);
  next.players[playerId] = moveCard(
    next.players[playerId],
    cardId,
    from,
    "sacrificed",
  );
  return enqueueEffects(
    next,
    { playerId, sourceCardId: cardId, abilityId },
    ability.effects,
  );
}

/** Preserve provenance so only market cards can replenish an exhausted market. */
export function collectSacrificedCards(game: GameState): void {
  for (const player of Object.values(game.players)) {
    for (const cardId of [...player.zones.sacrificed]) {
      const card = game.cards[cardId];
      const isFireGem = game.cardDefinitions[card.definitionId].isFireGem;
      if (!isFireGem && card.origin !== "market") continue;
      player.zones.sacrificed = player.zones.sacrificed.filter(
        (id) => id !== cardId,
      );
      game.cards[cardId].ownerId = null;
      game.cards[cardId].usedAbilities = [];
      (isFireGem ? game.market.fireGems : game.market.sacrificed).push(cardId);
    }
  }
}
