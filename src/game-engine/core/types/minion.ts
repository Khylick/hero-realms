export interface MinionDefinition {
  id: string;
  name: string;
  description: string;

  maxHealth: number;
  attack: number;

  isGuard: boolean;

  behaviorIds: string[];
}

export type MinionRegistry = Record<
  string,
  MinionDefinition
>;