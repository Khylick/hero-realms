import type { GameState } from "../types/game-state";
import type { CardDefinitionId } from "../types/common";

import { createCard } from "../factories/create-card";
import {
  createSeededRandom,
  shuffle,
} from "../utils/random";
import { spendResource } from "./resources";

const MARKET_SIZE = 5;

export function createMarket(
    game: GameState,
    definitions: CardDefinitionId[],
): GameState {
    if (game.status !== "setup") {
        throw new Error(
            "Le marché doit être initialisé avant la partie.",
        );
    }

    if (
        game.market.deck.length > 0 ||
        game.market.row.length > 0 ||
        game.market.sacrificed.length > 0
    ) {
        throw new Error("Le marché est déjà initialisé.");
    }

    if (definitions.length < MARKET_SIZE) {
        throw new Error(
            "Le marché nécessite au moins cinq cartes.",
        );
    }

    const next = structuredClone(game);
    const random = createSeededRandom(next.randomState);
    const ids: string[] = [];

    for (const definitionId of definitions) {
        if (!next.cardDefinitions[definitionId]) {
            throw new Error(
                `Définition inconnue : ${definitionId}`,
            );
        }

        const id = `market-card-${next.nextCardInstanceId++}`;

        next.cards[id] = createCard({
            id,
            definitionId,
            ownerId: null,
        });

        ids.push(id);
    }

    const deck = shuffle(ids, random);
    const row: string[] = [];

    while (row.length < MARKET_SIZE) {
        const cardId = deck.pop();

        if (cardId === undefined) break;

        row.push(cardId);
    }

    next.market.deck = deck;
    next.market.row = row;
    next.randomState = random.getState();

    return next;
}

export function buyCard(
  game: GameState,
  playerId: string,
  cardId: string,
): GameState {
  if (
    game.status !== "playing" ||
    game.phase !== "main" ||
    game.activePlayerId !== playerId
  ) {
    throw new Error("Achat interdit à cette phase.");
  }

  if (!game.market.row.includes(cardId)) {
    throw new Error(
      "Cette carte n'est pas disponible au marché.",
    );
  }

  const card = game.cards[cardId];
  const definition = game.cardDefinitions[card.definitionId];
  const player = game.players[playerId];

  if (!player || player.defeated) {
    throw new Error("Joueur invalide.");
  }

  if (!definition) {
    throw new Error("Définition de carte inconnue.");
  }

  if (card.ownerId !== null) {
    throw new Error("Cette carte possède déjà un propriétaire.");
  }

  if (
    !Number.isSafeInteger(definition.cost) ||
    definition.cost < 0
  ) {
    throw new Error("Coût de carte invalide.");
  }

  const updatedPlayer = spendResource(
    player,
    "gold",
    definition.cost,
  );

  const next = structuredClone(game);

  next.players[playerId] = {
    ...updatedPlayer,
    zones: {
      ...updatedPlayer.zones,
      discard: [
        ...updatedPlayer.zones.discard,
        cardId,
      ],
    },
  };

  next.cards[cardId].ownerId = playerId;

  next.market.row = next.market.row.filter(
    (id) => id !== cardId,
  );

  const replacement = next.market.deck.pop();

  if (replacement !== undefined) {
    next.market.row.push(replacement);
  }

  return next;
}