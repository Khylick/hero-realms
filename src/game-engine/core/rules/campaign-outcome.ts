import type { GameState } from "../types/game-state";

/** Mutates only the private working copy owned by a rule reducer. */
export function updateCampaignOutcome(game: GameState): void {
  const encounter = game.campaignEncounter;
  if (!encounter || encounter.progress.status !== "inProgress") return;
  if (encounter.master.defeated) {
    game.status = "victory";
    encounter.progress.status = "victory";
    game.log.push("Victoire : le Maître est vaincu.");
  } else if (game.playerOrder.every((id) => game.players[id].defeated)) {
    game.status = "defeat";
    encounter.progress.status = "defeat";
    game.log.push("Défaite : tous les héros sont vaincus.");
  }
  if (game.status !== "playing") {
    game.phase = "ended";
    encounter.steps = [];
    encounter.pendingChoice = null;
    encounter.master.combat = 0;
    game.resolution.queue = [];
    game.resolution.pendingChoice = null;
  }
}
