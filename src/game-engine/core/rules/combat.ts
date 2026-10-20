import type { GameState } from "../types/game-state";
import type {
  CardId,
  PlayerId,
} from "../types/common";

import { spendResource, damagePlayer } from "./resources";
import { stunChampion } from "./champions";
import {
  canTargetChampion,
  canTargetPlayer,
} from "./targeting";

function assertCanAttack(
  game: GameState,
  attackerId: PlayerId,
  targetPlayerId: PlayerId,
): void {
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== attackerId
  ) {
    throw new Error(
      "Impossible d'attaquer maintenant.",
    );
  }

  if (game.resolution.pendingChoice) {
    throw new Error(
      "Un choix doit être résolu avant d'attaquer.",
    );
  }

  if (game.resolution.queue.length > 0) {
    throw new Error(
      "Une résolution d'effets est en cours.",
    );
  }

  if (attackerId === targetPlayerId) {
    throw new Error(
      "Un joueur ne peut pas s'attaquer lui-même.",
    );
  }

  const attacker = game.players[attackerId];
  const target = game.players[targetPlayerId];

  if (!attacker || !target) {
    throw new Error("Joueur introuvable.");
  }

  if (attacker.defeated || target.defeated) {
    throw new Error(
      "Un joueur vaincu ne peut pas participer au combat.",
    );
  }
}

export function attackChampion(
  game: GameState,
  attackerId: PlayerId,
  targetPlayerId: PlayerId,
  cardId: CardId,
): GameState {
  assertCanAttack(game, attackerId, targetPlayerId);

  if (
    !canTargetChampion(
      game,
      targetPlayerId,
      cardId,
    )
  ) {
    throw new Error(
      "Ce champion ne peut pas être ciblé.",
    );
  }

  const card = game.cards[cardId];
  const definition =
    game.cardDefinitions[card.definitionId];

  const defense = definition.defense;

  if (
    defense === undefined ||
    !Number.isSafeInteger(defense) ||
    defense <= 0
  ) {
    throw new Error(
      "Défense du champion invalide.",
    );
  }

  const next = structuredClone(game);

  next.players[attackerId] = spendResource(
    next.players[attackerId],
    "combat",
    defense,
  );

  return stunChampion(
    next,
    targetPlayerId,
    cardId,
  );
}

export function attackPlayer(
  game: GameState,
  attackerId: PlayerId,
  targetPlayerId: PlayerId,
  amount: number,
): GameState {
  assertCanAttack(game, attackerId, targetPlayerId);

  if (!canTargetPlayer(game, targetPlayerId)) {
    throw new Error(
      "Ce joueur est protégé par un garde.",
    );
  }

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Le montant de l'attaque doit être positif.",
    );
  }

  const next = structuredClone(game);

  next.players[attackerId] = spendResource(
    next.players[attackerId],
    "combat",
    amount,
  );

  next.players[targetPlayerId] = damagePlayer(
    next.players[targetPlayerId],
    amount,
  );

  return next;
}
