export interface MasterDefinition {
  id: string;
  name: string;
  description: string;

  maxHealth: number;

  // Valeur de combat utilisée par les
  // futures règles de comportement.
  attack: number;

  // Identifiants des comportements disponibles.
  behaviorIds: string[];
}

export type MasterRegistry = Record<
  string,
  MasterDefinition
>;