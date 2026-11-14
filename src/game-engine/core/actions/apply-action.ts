import type { GameState } from "../types/game-state";
import type { GameAction } from "../types/game-action";
import { processMasterTurn, resolveMasterChoice } from "../rules/master-turn";
import { clearCampaignHazard } from "../rules/campaign-hazards";
import {
  sacrificeInPlayCard,
  collectSacrificedCards,
} from "../rules/sacrifice";

import { startGame, endTurn } from "../rules/turn";
import { playCard } from "../rules/play-card";
import { buyCard, refillMarket } from "../rules/market";
import { resolveChoice, resolveOptionalAbility } from "../effects/effect-queue";
import { validateGameState } from "../rules/invariants";

import { activateAlly } from "../rules/alliances";
import { activateChampion } from "../rules/champions";
import { attackChampion, attackPlayer } from "../rules/combat";

import { activateCharacterPower } from "../rules/character-powers";

import { gainExperience } from "../rules/character-progression";

import {
  attackCampaignMaster,
  attackCampaignMinion,
} from "../rules/campaign-combat";

export function applyAction(game: GameState, action: GameAction): GameState {
  if (game.status === "victory" || game.status === "defeat")
    throw new Error("La partie est terminée.");
  if (
    game.campaignEncounter?.pendingChoice &&
    action.type !== "RESOLVE_MASTER_CHOICE"
  ) {
    throw new Error("Un choix du Maître doit être résolu.");
  }
  if (
    game.format === "campaign" &&
    (action.type === "ATTACK_PLAYER" ||
      action.type === "ATTACK_CHAMPION" ||
      action.type === "GAIN_EXPERIENCE")
  ) {
    throw new Error("Cette action n'est pas disponible en campagne.");
  }
  if (
    game.resolution.pendingChoice &&
    action.type !== "RESOLVE_CHOICE" &&
    action.type !== "RESOLVE_OPTIONAL_ABILITY"
  ) {
    throw new Error("Un choix doit être résolu avant toute autre action.");
  }

  if (game.resolution.queue.length > 0 && !game.resolution.pendingChoice) {
    throw new Error("La file d'effets doit être résolue.");
  }

  let next: GameState;

  switch (action.type) {
    case "RESOLVE_MASTER_CHOICE":
      next = resolveMasterChoice(
        game,
        action.playerId,
        action.choiceId,
        action.selectedId,
      );
      break;
    case "CLEAR_HAZARD":
      next = clearCampaignHazard(game, action.playerId, action.hazardId);
      break;
    case "SACRIFICE_CARD":
      next = sacrificeInPlayCard(
        game,
        action.playerId,
        action.cardId,
        action.abilityId,
      );
      break;
    case "START_GAME":
      next = startGame(game);
      break;

    case "PLAY_CARD":
      next = playCard(game, action.playerId, action.cardId);
      break;

    case "BUY_CARD":
      next = buyCard(game, action.playerId, action.cardId);
      break;

    case "ACTIVATE_ALLY":
      next = activateAlly(
        game,
        action.playerId,
        action.cardId,
        action.abilityId,
      );
      break;

    case "END_TURN":
      next = endTurn(game, action.playerId);
      break;

    case "RESOLVE_CHOICE":
      next = resolveChoice(
        game,
        action.playerId,
        action.choiceId,
        action.selectedCardIds,
      );
      break;

    case "RESOLVE_OPTIONAL_ABILITY":
      next = resolveOptionalAbility(
        game,
        action.playerId,
        action.choiceId,
        action.accept,
      );
      break;

    case "USE_CHAMPION":
      next = activateChampion(
        game,
        action.playerId,
        action.cardId,
        action.abilityId,
      );
      break;

    case "ATTACK_CHAMPION":
      next = attackChampion(
        game,
        action.playerId,
        action.targetPlayerId,
        action.cardId,
      );
      break;

    case "ATTACK_PLAYER":
      next = attackPlayer(
        game,
        action.playerId,
        action.targetPlayerId,
        action.amount,
      );
      break;

    case "ATTACK_ENEMY":
      next =
        action.enemyId === game.campaignEncounter?.master.id
          ? attackCampaignMaster(game, action.playerId, action.amount)
          : attackCampaignMinion(
              game,
              action.playerId,
              action.enemyId,
              action.amount,
            );
      break;

    case "USE_CHARACTER_POWER":
      next = activateCharacterPower(game, action.playerId, action.powerId);
      break;

    case "GAIN_EXPERIENCE":
      next = gainExperience(game, action.playerId, action.amount);
      break;

    case "ATTACK_CAMPAIGN_MINION":
      next = attackCampaignMinion(
        game,
        action.playerId,
        action.minionId,
        action.combat,
      );
      break;

    case "ATTACK_CAMPAIGN_MASTER":
      next = attackCampaignMaster(game, action.playerId, action.combat);
      break;

    default: {
      const exhaustive: never = action;

      throw new Error(`Action inconnue : ${JSON.stringify(exhaustive)}`);
    }
  }

  if (
    next.phase === "master" &&
    !next.resolution.pendingChoice &&
    !next.campaignEncounter?.pendingChoice
  ) {
    next = processMasterTurn(next);
  }
  collectSacrificedCards(next);
  refillMarket(next);
  if ("playerId" in action) {
    const name =
      "cardId" in action && next.cards[action.cardId]
        ? next.cardDefinitions[next.cards[action.cardId].definitionId].name
        : "";
    if (action.type === "PLAY_CARD")
      next.log.push(`${next.players[action.playerId].name} joue ${name}.`);
    if (action.type === "BUY_CARD")
      next.log.push(`${next.players[action.playerId].name} acquiert ${name}.`);
    if (action.type === "SACRIFICE_CARD")
      next.log.push(`${next.players[action.playerId].name} sacrifie ${name}.`);
    if (action.type === "USE_CHARACTER_POWER")
      next.log.push(
        `${next.players[action.playerId].name} utilise ${next.powerDefinitions[action.powerId].name}.`,
      );
  }
  const errors = validateGameState(next);

  if (errors.length > 0) {
    throw new Error(`État de jeu invalide :\n${errors.join("\n")}`);
  }

  return next;
}
