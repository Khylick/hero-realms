import type {
  GameState,
} from "../types/game-state";

import type {
  PlayerId,
} from "../types/common";

import {
  canTargetCampaignMaster,
  canTargetCampaignMinion,
} from "./campaign-targeting";

function assertCanAttackCampaignEnemy(
  game: GameState,
  playerId: PlayerId,
  combat: number,
): void {
  if (
    game.status !== "playing" ||
    game.phase !== "main"
  ) {
    throw new Error(
      "Une attaque de campagne nécessite une partie en cours et la phase principale.",
    );
  }

  if (game.activePlayerId !== playerId) {
    throw new Error(
      "Seul le joueur actif peut attaquer.",
    );
  }

  if (
    game.resolution.pendingChoice ||
    game.resolution.queue.length > 0
  ) {
    throw new Error(
      "Une résolution est déjà en attente.",
    );
  }

  const encounter = game.campaignEncounter;

  if (
    !encounter ||
    encounter.progress.status !== "inProgress"
  ) {
    throw new Error(
      "Aucune rencontre de campagne en cours.",
    );
  }

  const player = game.players[playerId];

  if (!player) {
    throw new Error(
      `Joueur introuvable : ${playerId}.`,
    );
  }

  if (player.defeated || player.health <= 0) {
    throw new Error(
      "Un héros vaincu ne peut pas attaquer.",
    );
  }

  if (
    !Number.isSafeInteger(combat) ||
    combat <= 0
  ) {
    throw new Error(
      "Le combat dépensé doit être un entier strictement positif.",
    );
  }

  if (player.resources.combat < combat) {
    throw new Error(
      "Le héros ne possède pas assez de combat.",
    );
  }
}

export function attackCampaignMinion(
  game: GameState,
  playerId: PlayerId,
  minionId: string,
  combat: number,
): GameState {
  assertCanAttackCampaignEnemy(
    game,
    playerId,
    combat,
  );

  const encounter = game.campaignEncounter!;

  const minion = encounter.minions[minionId];

  if (!minion) {
    throw new Error(
      `Sbire introuvable : ${minionId}.`,
    );
  }

  if (!canTargetCampaignMinion(encounter, minionId)) {
    throw new Error(
      "Ce sbire ne peut pas être ciblé.",
    );
  }

  const next = structuredClone(game);

  const nextEncounter = next.campaignEncounter!;
  const nextMinion = nextEncounter.minions[minionId];

  const damage = Math.min(
    combat,
    nextMinion.health,
  );

  nextMinion.health -= damage;

  if (nextMinion.health === 0) {
    nextMinion.defeated = true;
  }

  next.players[playerId].resources.combat -= combat;

  return next;
}

export function attackCampaignMaster(
  game: GameState,
  playerId: PlayerId,
  combat: number,
): GameState {
  assertCanAttackCampaignEnemy(
    game,
    playerId,
    combat,
  );

  const encounter = game.campaignEncounter!;

  if (!canTargetCampaignMaster(encounter)) {
    throw new Error(
      "Le maître ne peut pas être ciblé.",
    );
  }

  const next = structuredClone(game);

  const nextMaster = next.campaignEncounter!.master;

  const damage = Math.min(
    combat,
    nextMaster.health,
  );

  nextMaster.health -= damage;

  if (nextMaster.health === 0) {
    nextMaster.defeated = true;
  }

  next.players[playerId].resources.combat -= combat;

  return next;
}
