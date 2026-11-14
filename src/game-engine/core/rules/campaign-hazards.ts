import type { GameState } from "../types/game-state";
import { spendResource } from "./resources";

export function clearCampaignHazard(
  game: GameState,
  playerId: string,
  hazardId: string,
): GameState {
  const encounter = game.campaignEncounter;
  const hazard = encounter?.hazards[hazardId];
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== playerId ||
    game.resolution.pendingChoice ||
    game.resolution.queue.length ||
    encounter?.pendingChoice ||
    !hazard?.active ||
    hazard.zoneOwnerId !== playerId
  ) {
    throw new Error("Ce danger ne peut pas être dissipé.");
  }
  const definition = encounter!.content.hazards[hazard.definitionId];
  if (!definition.clearCost)
    throw new Error("Aucune condition de dissipation définie.");
  const next = structuredClone(game);
  next.players[playerId] = spendResource(
    next.players[playerId],
    definition.clearCost.resource,
    definition.clearCost.amount,
  );
  next.campaignEncounter!.hazards[hazardId].active = false;
  if (hazard.sourceCardId)
    next.campaignEncounter!.master.discard.push(hazard.sourceCardId);
  next.log.push(`Danger dissipé : ${definition.name}.`);
  return next;
}
