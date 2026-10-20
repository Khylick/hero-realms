import {
  createCard,
  createGame,
  createPlayer,
  type CardId,
  type GameState,
  type PlayerId,
} from "../../core";

import { demoCards } from
  "../../../game-content/cards/demo-cards";

export function createScenario(): GameState {
  const attacker = createPlayer({
    id: "player-1",
    name: "Héros impérial",
    characterClass: "fighter",
  });

  const defender = createPlayer({
    id: "player-2",
    name: "Héros adverse",
    characterClass: "wizard",
  });

  const game = createGame({
    id: "integration-scenario",
    mode: "local",
    players: [attacker, defender],
    cardDefinitions: demoCards,
    seed: 12345,
  });

  game.status = "playing";
  game.phase = "main";
  game.activePlayerId = "player-1";

  return game;
}

export function addCardToZone(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
  definitionId: string,
  zone: "deck" | "hand" | "discard" |
    "inPlay" | "champions",
): GameState {
  const next = structuredClone(game);

  if (!next.players[playerId]) {
    throw new Error("Joueur introuvable.");
  }

  if (next.cards[cardId]) {
    throw new Error(
      `Identifiant de carte déjà utilisé : ${cardId}`,
    );
  }

  if (!next.cardDefinitions[definitionId]) {
    throw new Error(
      `Définition inconnue : ${definitionId}`,
    );
  }

  next.cards[cardId] = createCard({
    id: cardId,
    definitionId,
    ownerId: playerId,
  });

  next.players[playerId].zones[zone].push(cardId);

  return next;
}

export function addCombat(
  game: GameState,
  playerId: PlayerId,
  amount: number,
): GameState {
  const next = structuredClone(game);

  if (
    !Number.isSafeInteger(amount) ||
    amount < 0
  ) {
    throw new Error("Montant invalide.");
  }

  const player = next.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  player.resources.combat += amount;

  return next;
}
