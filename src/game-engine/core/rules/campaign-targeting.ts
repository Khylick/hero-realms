import type { CampaignEncounterState } from "../types/campaign-encounter-state";

export function hasActiveCampaignGuards(
  encounter: CampaignEncounterState,
  zoneOwnerId = "master",
): boolean {
  return Object.values(encounter.minions).some(
    (minion) =>
      !minion.defeated &&
      minion.health > 0 &&
      minion.zoneOwnerId === zoneOwnerId &&
      !minion.exhausted &&
      minion.isGuard,
  );
}

export function canReachCampaignArea(
  encounter: CampaignEncounterState,
  playerId: string,
  zoneOwnerId: string,
): boolean {
  if (zoneOwnerId === playerId) return true;
  if (
    Object.values(encounter.minions).some(
      (minion) =>
        minion.zoneOwnerId === playerId &&
        !minion.defeated &&
        !minion.exhausted,
    )
  )
    return false;
  if (zoneOwnerId === "master") return true;
  // The Master's virtual seat separates the two ends of the seating order.
  const index = encounter.playerOrder.indexOf(playerId);
  const targetIndex = encounter.playerOrder.indexOf(zoneOwnerId);
  return index >= 0 && targetIndex >= 0 && Math.abs(index - targetIndex) === 1;
}

export function canTargetCampaignMinion(
  encounter: CampaignEncounterState,
  minionId: string,
  playerId = encounter.playerOrder[0] ?? "master",
): boolean {
  const minion = encounter.minions[minionId];

  if (!minion || minion.defeated) {
    return false;
  }

  if (minion.health <= 0) {
    return false;
  }

  if (!canReachCampaignArea(encounter, playerId, minion.zoneOwnerId))
    return false;

  if (
    hasActiveCampaignGuards(encounter, minion.zoneOwnerId) &&
    !minion.isGuard
  ) {
    return false;
  }

  return true;
}

export function canTargetCampaignMaster(
  encounter: CampaignEncounterState,
  playerId = encounter.playerOrder[0] ?? "master",
): boolean {
  if (encounter.master.defeated) {
    return false;
  }

  if (encounter.master.health <= 0) {
    return false;
  }

  return (
    canReachCampaignArea(encounter, playerId, "master") &&
    !hasActiveCampaignGuards(encounter, "master")
  );
}
