import type {
  CardDefinitionId,
  CardId,
  PlayerId,
} from "../types/common";

import type { CardInstance } from "../types/card";

interface CreateCardOptions {
    id: CardId;
    definitionId: CardDefinitionId;
    ownerId?: PlayerId | null;
}

export function createCard({
  id,
  definitionId,
  ownerId = null,
}: CreateCardOptions): CardInstance {
  return {
    id,
    definitionId,
    ownerId,
    exhausted: false,
    usedAbilities: [],
  };
}