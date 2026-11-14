import type { CardDefinitionId, CardId, PlayerId } from "../types/common";

import type { CardInstance } from "../types/card";

interface CreateCardOptions {
  id: CardId;
  definitionId: CardDefinitionId;
  ownerId?: PlayerId | null;
  origin?: CardInstance["origin"];
}

export function createCard({
  id,
  definitionId,
  ownerId = null,
  origin = "personal",
}: CreateCardOptions): CardInstance {
  return {
    id,
    definitionId,
    ownerId,
    origin,
    exhausted: false,
    usedAbilities: [],
  };
}
