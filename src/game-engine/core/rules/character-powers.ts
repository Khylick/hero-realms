import type {
  GameState,
} from "../types/game-state";

import type {
  PlayerId,
} from "../types/common";

import type {
  CharacterPowerDefinition,
} from "../types/character-power";

import {
  spendResource,
} from "./resources";

import {
  enqueueEffects,
  processEffectQueue,
} from "../effects/effect-queue";

export function canUseCharacterPower(
  game: GameState,
  playerId: PlayerId,
  powerId: string,
): boolean {
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== playerId
  ) {
    return false;
  }

  if (
    game.resolution.pendingChoice ||
    game.resolution.queue.length > 0
  ) {
    return false;
  }

  const player = game.players[playerId];
  const power = game.powerDefinitions[powerId];

  if (!player || !power || player.defeated) {
    return false;
  }

  if (!player.powers.availablePowerIds.includes(powerId)) {
    return false;
  }

  if (
    power.usage === "oncePerTurn" &&
    player.powers.usedThisTurn.includes(powerId)
  ) {
    return false;
  }

  if (
    power.usage === "oncePerEncounter" &&
    player.powers.usedThisEncounter.includes(powerId)
  ) {
    return false;
  }

  if (power.cost.type !== "none") {
    if (
      player.resources[power.cost.type] <
      power.cost.amount
    ) {
      return false;
    }
  }

  return true;
}

export function useCharacterPower(
  game: GameState,
  playerId: PlayerId,
  powerId: string,
): GameState {
  if (!canUseCharacterPower(game, playerId, powerId)) {
    throw new Error(
      "Ce pouvoir ne peut pas être utilisé.",
    );
  }

  const next = structuredClone(game);

  const player = next.players[playerId];

  const power: CharacterPowerDefinition =
    next.powerDefinitions[powerId];

  // 1. Payer le coût.
  if (power.cost.type !== "none") {
    next.players[playerId] = spendResource(
      player,
      power.cost.type,
      power.cost.amount,
    );
  }

  // 2. Enregistrer l'utilisation.
  const updatedPlayer = next.players[playerId];

  if (power.usage === "oncePerTurn") {
    updatedPlayer.powers.usedThisTurn.push(powerId);
  } else {
    updatedPlayer.powers.usedThisEncounter.push(powerId);
  }

  // 3. Préparer les effets.
  const withEffects = enqueueEffects(
    next,
    {
      playerId,
      sourceCardId: `power:${powerId}`,
      abilityId: powerId,
    },
    power.effects,
  );

  // 4. Résoudre les effets.
  return processEffectQueue(withEffects);
}
