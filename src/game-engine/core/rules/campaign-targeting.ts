import type {
  CampaignEncounterState,
} from "../types/campaign-encounter-state";

export function hasActiveCampaignGuards(
  encounter: CampaignEncounterState,
): boolean {
  return Object.values(encounter.minions).some(
    (minion) =>
      !minion.defeated &&
      minion.health > 0 &&
      minion.isGuard,
  );
}

export function canTargetCampaignMinion(
  encounter: CampaignEncounterState,
  minionId: string,
): boolean {
  const minion = encounter.minions[minionId];

  if (!minion || minion.defeated) {
    return false;
  }

  if (minion.health <= 0) {
    return false;
  }

  if (
    hasActiveCampaignGuards(encounter) &&
    !minion.isGuard
  ) {
    return false;
  }

  return true;
}

export function canTargetCampaignMaster(
  encounter: CampaignEncounterState,
): boolean {
  if (encounter.master.defeated) {
    return false;
  }

  if (encounter.master.health <= 0) {
    return false;
  }

  return !hasActiveCampaignGuards(encounter);
}
