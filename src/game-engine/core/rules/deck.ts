import type {
  CardDefinitionId,
  CardId,
} from "../types/common";

import type {
  CardInstance,
} from "../types/card";

import type {
  PlayerState,
} from "../types/player";

import {
  createCard,
} from "../factories/create-card";

import {
  shuffle,
  type RandomGenerator,
} from "../utils/random";

import { moveCard } from "./card-zones";
import type { PlayerZone } from "./card-zones";

export interface DeckResult {
    player: PlayerState;
    cards: Record<CardId, CardInstance>;
}

export function createStartingDeck(
    player: PlayerState,
    definitions: CardDefinitionId[],
    random: RandomGenerator,
): DeckResult {
    if (
        player.zones.deck.length > 0 ||
        player.zones.hand.length > 0 ||
        player.zones.discard.length > 0 ||
        player.zones.inPlay.length > 0 ||
        player.zones.champions.length > 0 ||
        player.zones.sacrificed.length > 0
    ) {
        throw new Error(
            "Le joueur possède déjà des cartes.",
        );
    }

    const cards: Record<CardId, CardInstance> = {};
    const cardIds: CardId[] = [];

    definitions.forEach((definitionId, index) => {
        const id = `${player.id}-card-${index + 1}`;

        cards[id] = createCard({
            id,
            definitionId,
            ownerId: player.id,
        });

        cardIds.push(id);
    });

    return {
        player: {
            ...player,
            zones: {
                ...player.zones,
                deck: shuffle(cardIds, random),
            },
        },
        cards,
    };
}

export function drawCards(
  player: PlayerState,
  amount: number,
  random: RandomGenerator,
): PlayerState {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(
      "Le nombre de cartes à piocher doit être un entier positif ou nul.",
    );
  }

  let deck = [...player.zones.deck];
  let discard = [...player.zones.discard];
  const hand = [...player.zones.hand];

  for (let i = 0; i < amount; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) {
        break;
      }

      deck = shuffle(discard, random);
      discard = [];
    }

    const cardId = deck.pop();

    if (cardId !== undefined) {
      hand.push(cardId);
    }
  }

  return {
    ...player,
    zones: {
      ...player.zones,
      deck,
      discard,
      hand,
    },
  };
}

export function discardCard(
  player: PlayerState,
  cardId: CardId,
): PlayerState {
  return moveCard(
    player,
    cardId,
    "hand",
    "discard",
  );
}

export function sacrificeCard(
  player: PlayerState,
  cardId: CardId,
  from: PlayerZone,
): PlayerState {
  if (from === "sacrificed") {
    throw new Error(
      "Une carte sacrifiée ne peut pas être sacrifiée à nouveau.",
    );
  }

  return moveCard(
    player,
    cardId,
    from,
    "sacrificed",
  );
}
