import type {
  CardDefinitionId,
  CardId,
  Faction,
  PlayerId,
} from "./common";

import type { CardAbility } from "./ability";

export type CardType =
  | "action"
  | "item"
  | "champion";

export interface CardDefinition {
  id: CardDefinitionId;
  name: string;

  type: CardType;
  faction?: Faction;

  cost: number;

  defense?: number;
  isGuard?: boolean;

  abilities: CardAbility[];

  image?: string;
}

export interface CardInstance {
  id: CardId;
  definitionId: CardDefinitionId;

  ownerId: PlayerId | null;

  exhausted: boolean;

  usedAbilities: string[];
}