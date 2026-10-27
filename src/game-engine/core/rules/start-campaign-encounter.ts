import type {
  GameState,
} from "../types/game-state";

export function startCampaignEncounter(
  game: GameState,
): GameState {
  if (game.status !== "playing") {
    throw new Error(
      "La partie doit être en cours.",
    );
  }

  const encounter = game.campaignEncounter;

  if (!encounter) {
    throw new Error(
      "Aucune rencontre de campagne initialisée.",
    );
  }

  if (encounter.progress.status !== "notStarted") {
    throw new Error(
      "La rencontre a déjà commencé.",
    );
  }

  const next = structuredClone(game);

  next.campaignEncounter!.progress.status =
    "inProgress";

  next.campaignEncounter!.progress.round = 1;

  return next;
}
