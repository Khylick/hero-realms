
import type { GameState } from "../types/game-state";
import type { PlayerState } from "../types/player";

import { drawCards } from "./deck";
import { resetResources } from "./resources";
import { createSeededRandom } from "../utils/random";

import { readyChampions } from "./champions";

const HAND_SIZE = 5;

export function startGame(
  game: GameState,
): GameState {
  if (game.status !== "setup") {
    throw new Error("La partie a déjà démarré.");
  }

  if (game.playerOrder.length === 0) {
    throw new Error("Aucun joueur.");
  }

  if (game.market.row.length === 0) {
    throw new Error("Le marché n'est pas initialisé.");
  }

  const next = structuredClone(game);
  const random = createSeededRandom(next.randomState);

  for (const playerId of next.playerOrder) {
    const player = next.players[playerId];

    if (!player || player.zones.deck.length === 0) {
      throw new Error(
        `Deck initial manquant pour ${playerId}.`,
      );
    }

    next.players[playerId] = drawCards(
      player,
      HAND_SIZE,
      random,
    );
  }

  next.randomState = random.getState();
  next.status = "playing";
  next.phase = "main";
  next.turnNumber = 1;
  next.activePlayerId = next.playerOrder[0];

  return readyChampions(
    next,
    next.activePlayerId,
  );
}

function cleanupPlayer(
  player: PlayerState,
): PlayerState {
  const cardsToDiscard = [
    ...player.zones.hand,
    ...player.zones.inPlay,
  ];

  return resetResources({
    ...player,
    zones: {
      ...player.zones,
      hand: [],
      inPlay: [],
      discard: [
        ...player.zones.discard,
        ...cardsToDiscard,
      ],
    },
  });
}

export function endTurn(
  game: GameState,
  playerId: string,
): GameState {
  if (
    game.status !== "playing" ||
    game.phase !== "main"
  ) {
    throw new Error(
      "Impossible de terminer le tour.",
    );
  }

  if (game.activePlayerId !== playerId) {
    throw new Error(
      "Ce n'est pas le tour de ce joueur.",
    );
  }

  const next = structuredClone(game);
  const random = createSeededRandom(next.randomState);

  const cardsLeavingPlay = [
    ...next.players[playerId].zones.inPlay,
  ];

  for (const cardId of cardsLeavingPlay) {
    next.cards[cardId].usedAbilities = [];
  }

  const player = cleanupPlayer(next.players[playerId]);

  next.players[playerId] = drawCards(
    player,
    HAND_SIZE,
    random,
  );

  next.randomState = random.getState();

  const currentIndex =
    next.playerOrder.indexOf(playerId);

  const nextIndex =
    (currentIndex + 1) % next.playerOrder.length;

  next.activePlayerId = next.playerOrder[nextIndex];
  next.turnNumber += 1;

  return readyChampions(
    next, 
    next.activePlayerId
  );
}