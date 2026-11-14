import type { GameState } from "../types/game-state";
import type {
  EffectContext,
  ResolutionStep,
  ChoiceCardAction,
  ChoiceCardZone,
} from "../types/resolution";
import type { CardEffect } from "../types/effect";
import type { CardAbility } from "../types/ability";

import { drawCards } from "../rules/deck";
import { moveCard } from "../rules/card-zones";
import { resolveSimpleEffect } from "./resolve-effects";
import { createSeededRandom } from "../utils/random";

export function enqueueEffects(
  game: GameState,
  context: EffectContext,
  effects: CardEffect[],
): GameState {
  if (game.resolution.pendingChoice) {
    throw new Error("Impossible d'ajouter des effets pendant un choix.");
  }

  const next = structuredClone(game);

  const queued: ResolutionStep[] = effects.map((effect) => ({
    context,
    effect,
  }));

  next.resolution.queue.push(...queued);

  return processEffectQueue(next);
}

export function enqueuePlayAbilities(
  game: GameState,
  playerId: string,
  sourceCardId: string,
  abilities: CardAbility[],
): GameState {
  const next = structuredClone(game);
  const queued: ResolutionStep[] = [];

  for (const ability of abilities) {
    const context = {
      playerId,
      sourceCardId,
      abilityId: ability.id,
    };

    if (ability.optional && ability.effects.length > 0) {
      queued.push({
        type: "optionalAbility",
        context,
        effects: ability.effects,
      });
      continue;
    }

    queued.push(
      ...ability.effects.map((effect) => ({
        context,
        effect,
      })),
    );
  }

  next.resolution.queue.push(...queued);
  return processEffectQueue(next);
}

function requestCardChoice(
  game: GameState,
  playerId: string,
  from: ChoiceCardZone,
  action: ChoiceCardAction,
  amount: number,
): boolean {
  const player = game.players[playerId];
  const availableCardIds = [...player.zones[from]];

  if (availableCardIds.length === 0) {
    return false;
  }

  game.resolution.pendingChoice = {
    id: `choice-${game.resolution.nextChoiceId++}`,
    playerId,
    type: "selectCards",
    from,
    action,
    amount: Math.min(amount, availableCardIds.length),
    availableCardIds,
  };

  return true;
}

function assertSelfTarget(
  effect: Extract<
    CardEffect,
    { type: "discardCards" | "stunChampion" | "sacrificeCard" }
  >,
): void {
  if (effect.target !== "self") {
    throw new Error(
      `La cible "${effect.target}" de l'effet ${effect.type} n'est pas prise en charge.`,
    );
  }
}

export function processEffectQueue(game: GameState): GameState {
  const next = structuredClone(game);

  if (next.resolution.pendingChoice) {
    return next;
  }

  while (next.resolution.queue.length > 0) {
    const queued = next.resolution.queue.shift();

    if (!queued) {
      break;
    }

    if (!("effect" in queued)) {
      next.resolution.pendingChoice = {
        id: `choice-${next.resolution.nextChoiceId++}`,
        playerId: queued.context.playerId,
        type: "optionalAbility",
        context: queued.context,
        effects: queued.effects,
      };
      return next;
    }

    const { context, effect } = queued;
    const player = next.players[context.playerId];

    if (!player) {
      throw new Error("Joueur de l'effet introuvable.");
    }

    switch (effect.type) {
      case "gainGold":
      case "gainCombat":
      case "heal": {
        next.players[context.playerId] = resolveSimpleEffect(player, effect);
        break;
      }

      case "drawCards": {
        const random = createSeededRandom(next.randomState);

        next.players[context.playerId] = drawCards(
          player,
          effect.amount,
          random,
        );

        next.randomState = random.getState();
        break;
      }

      case "discardCards": {
        assertSelfTarget(effect);

        if (!Number.isSafeInteger(effect.amount) || effect.amount < 1) {
          throw new Error("Nombre de cartes à défausser invalide.");
        }

        if (
          requestCardChoice(
            next,
            context.playerId,
            "hand",
            "discard",
            effect.amount,
          )
        ) {
          return next;
        }
        break;
      }

      case "stunChampion":
        assertSelfTarget(effect);

        if (requestCardChoice(next, context.playerId, "champions", "stun", 1)) {
          return next;
        }
        break;

      case "sacrificeCard":
        assertSelfTarget(effect);

        if (requestCardChoice(next, context.playerId, "hand", "sacrifice", 1)) {
          return next;
        }
        break;

      case "chooseCard": {
        if (effect.from === "discard" && effect.action === "discard") {
          throw new Error("Impossible de défausser une carte déjà défaussée.");
        }

        if (!Number.isSafeInteger(effect.amount) || effect.amount < 1) {
          throw new Error("Nombre de cartes à choisir invalide.");
        }

        if (
          requestCardChoice(
            next,
            context.playerId,
            effect.from,
            effect.action,
            effect.amount,
          )
        ) {
          return next;
        }
        break;
      }

      default:
        throw new Error(`Effet non implémenté : ${JSON.stringify(effect)}`);
    }
  }

  return next;
}

export function resolveOptionalAbility(
  game: GameState,
  playerId: string,
  choiceId: string,
  accept: boolean,
): GameState {
  if (
    game.status !== "playing" ||
    (game.phase !== "main" && game.phase !== "master")
  ) {
    throw new Error(
      "Impossible de résoudre une capacité optionnelle hors de la phase principale.",
    );
  }

  const choice = game.resolution.pendingChoice;

  if (!choice || choice.type !== "optionalAbility") {
    throw new Error("Aucune capacité optionnelle n'est en attente.");
  }

  if (choice.id !== choiceId) {
    throw new Error("Identifiant de choix invalide.");
  }

  if (choice.playerId !== playerId) {
    throw new Error("Ce choix appartient à un autre joueur.");
  }

  const next = structuredClone(game);
  next.resolution.pendingChoice = null;

  if (accept) {
    next.resolution.queue.unshift(
      ...choice.effects.map((effect) => ({
        context: choice.context,
        effect,
      })),
    );
  }

  return processEffectQueue(next);
}

export function resolveChoice(
  game: GameState,
  playerId: string,
  choiceId: string,
  selectedCardIds: string[],
): GameState {
  if (
    game.status !== "playing" ||
    (game.phase !== "main" && game.phase !== "master")
  ) {
    throw new Error(
      "impossible de résoudre un choix hors de la phase principale.",
    );
  }

  const choice = game.resolution.pendingChoice;

  if (!choice || choice.type !== "selectCards") {
    throw new Error("Aucun choix en attente.");
  }

  if (choice.id !== choiceId) {
    throw new Error("Identifiant de choix invalide.");
  }

  if (choice.playerId !== playerId) {
    throw new Error("Ce choix appartient à un autre joueur.");
  }

  if (selectedCardIds.length !== choice.amount) {
    throw new Error(`Il faut sélectionner ${choice.amount} carte(s).`);
  }

  if (new Set(selectedCardIds).size !== selectedCardIds.length) {
    throw new Error("Une carte ne peut pas être sélectionnée deux fois.");
  }

  const next = structuredClone(game);
  let player = next.players[playerId];

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  for (const cardId of selectedCardIds) {
    if (
      !choice.availableCardIds.includes(cardId) ||
      !player.zones[choice.from].includes(cardId)
    ) {
      throw new Error(`Carte non autorisée pour ce choix : ${cardId}`);
    }

    player = moveCard(
      player,
      cardId,
      choice.from,
      choice.action === "discard" || choice.action === "stun"
        ? "discard"
        : "sacrificed",
    );

    if (choice.action === "stun") {
      next.cards[cardId].exhausted = false;
      next.cards[cardId].usedAbilities = [];
    }
  }

  next.players[playerId] = player;
  next.resolution.pendingChoice = null;

  return processEffectQueue(next);
}
