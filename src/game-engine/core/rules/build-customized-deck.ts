
import type {
  CardDefinitionId,
} from "../types/common";

import type {
  HeroCustomization,
} from "../types/hero-profile";

export function buildCustomizedDeck(
  startingDeck: CardDefinitionId[],
  customization: HeroCustomization,
): CardDefinitionId[] {
  const deck = [...startingDeck];

  for (const cardId of customization.removedCardIds) {
    const index = deck.indexOf(cardId);

    if (index === -1) {
      throw new Error(
        `Impossible de retirer la carte ${cardId} du deck.`,
      );
    }

    deck.splice(index, 1);
  }

  deck.push(...customization.additionalCardIds);

  if (deck.length === 0) {
    throw new Error(
      "Le deck personnalisé ne peut pas être vide.",
    );
  }

  return deck;
}
