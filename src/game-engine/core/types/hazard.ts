export type HazardTrigger =
  | "onEncounterStart"
  | "onMasterTurnStart"
  | "onMasterTurnEnd"
  | "onHeroTurnStart";

export interface HazardDefinition {
  id: string;
  name: string;
  description: string;
  trigger: HazardTrigger;
  duration: number | null;
  effectIds: string[];
}

export type HazardRegistry = Record<
  string,
  HazardDefinition
>;