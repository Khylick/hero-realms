import type { GameState } from "../types/game-state";
import type { MasterEffect, MasterStep } from "../types/master-turn";
import { createSeededRandom, shuffle } from "../utils/random";
import { damagePlayer } from "./resources";
import { stunChampion } from "./champions";
import { enqueueEffects } from "../effects/effect-queue";
import { updateCampaignOutcome } from "./campaign-outcome";

function effectSteps(effects: MasterEffect[]): MasterStep[] {
  return effects.map((effect) => ({ type: "effect", effect }));
}

/** Distribute masteries over five piles, preserving the larger middle pile. */
export function prepareMasterDeck(game: GameState): GameState {
  const next = structuredClone(game);
  const encounter = next.campaignEncounter!;
  const cards = encounter.content.masterCards ?? {};
  const random = createSeededRandom(next.randomState);
  const normal = shuffle(
    encounter.master.deck.filter((id) => cards[id]?.kind !== "mastery"),
    random,
  );
  const masteries = encounter.master.deck.filter(
    (id) => cards[id]?.kind === "mastery",
  );
  if (masteries.length !== 5)
    throw new Error("Le deck du Maître doit contenir cinq maîtrises.");
  const size = Math.floor(normal.length / 5);
  const remainder = normal.length % 5;
  const deck: string[] = [];
  for (let index = 0; index < 5; index++) {
    const pile = normal.splice(0, size + (index === 2 ? remainder : 0));
    deck.push(...shuffle([...pile, masteries[index]], random));
  }
  encounter.master.deck = deck;
  next.randomState = random.getState();
  return next;
}

function summonMinion(
  game: GameState,
  definitionId: string,
  elite = false,
  sourceCardId: string | null = null,
): void {
  const encounter = game.campaignEncounter!;
  const definition = encounter.content.minions[definitionId];
  if (!definition) throw new Error(`Sbire inconnu : ${definitionId}.`);
  const id = `${encounter.progress.id}:minion:${encounter.nextEntityId++}`;
  encounter.minions[id] = {
    id,
    definitionId,
    health: definition.maxHealth,
    maxHealth: definition.maxHealth,
    defeated: false,
    isGuard: definition.isGuard,
    exhausted: false,
    zoneOwnerId: elite ? "master" : game.activePlayerId,
    sourceCardId,
  };
  encounter.progress.minionIds.push(id);
  game.log.push(`Arrivée : ${definition.name}${elite ? " (élite)" : ""}.`);
}

function applyMasterEffect(game: GameState, effect: MasterEffect): GameState {
  const encounter = game.campaignEncounter!;
  const playerId = game.activePlayerId;
  const player = game.players[playerId];
  switch (effect.type) {
    case "gainCombat":
      encounter.master.combat += effect.amount;
      game.log.push(`Le Maître gagne ${effect.amount} combat.`);
      break;
    case "healMaster":
      encounter.master.health += effect.amount;
      game.log.push(`Le Maître gagne ${effect.amount} santé.`);
      break;
    case "damageHero":
      game.players[playerId] = damagePlayer(player, effect.amount);
      game.log.push(`${player.name} subit ${effect.amount} dégâts directs.`);
      break;
    case "discardHero":
      if (player.defeated) break;
      game.log.push(`${player.name} doit défausser ${effect.amount} carte(s).`);
      return enqueueEffects(
        game,
        { playerId, sourceCardId: "master", abilityId: "master-discard" },
        [{ type: "discardCards", target: "self", amount: effect.amount }],
      );
    case "summonMinion":
      summonMinion(game, effect.definitionId, effect.elite);
      break;
  }
  return game;
}

function requestChoice(
  game: GameState,
  kind: "minionOrder" | "attackTarget",
  availableIds: string[],
): void {
  const encounter = game.campaignEncounter!;
  encounter.pendingChoice = {
    id: `master-choice-${encounter.nextChoiceId++}`,
    kind,
    availableIds,
    message:
      kind === "minionOrder"
        ? "Choisissez le prochain sbire à activer."
        : "Choisissez le champion à assommer parmi les ex æquo.",
  };
}

function activateMinion(game: GameState, id: string): void {
  const encounter = game.campaignEncounter!;
  const minion = encounter.minions[id];
  minion.exhausted = true;
  const definition = encounter.content.minions[minion.definitionId];
  encounter.master.combat += definition.attack;
  game.log.push(`${definition.name} produit ${definition.attack} combat.`);
}

function attackChampion(game: GameState, cardId: string): GameState {
  const definition = game.cardDefinitions[game.cards[cardId].definitionId];
  game.campaignEncounter!.master.combat -= definition.defense!;
  game.log.push(`Le Maître assomme ${definition.name}.`);
  return stunChampion(game, game.activePlayerId, cardId);
}

function resolveAttack(game: GameState): GameState {
  const player = game.players[game.activePlayerId];
  const master = game.campaignEncounter!.master;
  if (player.defeated) return game;
  const champions = player.zones.champions;
  const guards = champions.filter(
    (id) =>
      game.cardDefinitions[game.cards[id].definitionId].isGuard &&
      !game.cards[id].exhausted,
  );
  if (guards.length === 0 && master.combat >= player.health) {
    game.players[player.id] = damagePlayer(player, master.combat);
    master.combat = 0;
    return game;
  }
  const candidates = (guards.length ? guards : champions).filter(
    (id) =>
      game.cardDefinitions[game.cards[id].definitionId].defense! <=
      master.combat,
  );
  if (candidates.length) {
    const highest = Math.max(
      ...candidates.map(
        (id) => game.cardDefinitions[game.cards[id].definitionId].defense!,
      ),
    );
    const tied = candidates.filter(
      (id) =>
        game.cardDefinitions[game.cards[id].definitionId].defense === highest,
    );
    game.campaignEncounter!.steps.unshift({ type: "attack" });
    if (tied.length > 1) {
      requestChoice(game, "attackTarget", tied);
      return game;
    }
    return attackChampion(game, tied[0]);
  }
  if (!guards.length && master.combat) {
    game.log.push(`${player.name} subit ${master.combat} dégâts de combat.`);
    game.players[player.id] = damagePlayer(player, master.combat);
  }
  master.combat = 0;
  return game;
}

/** Resume after a player decision; each queued step is removed exactly once. */
export function processMasterTurn(game: GameState): GameState {
  let next = structuredClone(game);
  while (next.phase === "master" && next.status === "playing") {
    const encounter = next.campaignEncounter!;
    if (encounter.pendingChoice || next.resolution.pendingChoice) break;
    const step = encounter.steps.shift();
    if (!step) throw new Error("Étape du Maître incomplète.");
    switch (step.type) {
      case "effect":
        next = applyMasterEffect(next, step.effect);
        break;
      case "card": {
        const card = encounter.content.masterCards![step.cardId];
        switch (card.kind) {
          case "mastery":
            encounter.master.masteryCardIds.push(card.id);
            break;
          case "minion":
            summonMinion(next, card.definitionId!, card.elite, card.id);
            break;
          case "hazard": {
            const definition = encounter.content.hazards[card.definitionId!];
            const id = `${encounter.progress.id}:hazard:${encounter.nextEntityId++}`;
            encounter.hazards[id] = {
              id,
              definitionId: definition.id,
              active: true,
              remainingDuration: definition.duration,
              zoneOwnerId: next.activePlayerId,
              sourceCardId: card.id,
            };
            encounter.progress.hazardIds.push(id);
            if (definition.trigger === "onEncounterStart")
              encounter.steps.unshift(...effectSteps(definition.effects ?? []));
            break;
          }
          case "action":
            encounter.steps.unshift(...effectSteps(card.effects ?? []));
            encounter.master.discard.push(card.id);
            break;
        }
        next.log.push(`Le Maître révèle ${card.name}.`);
        break;
      }
      case "levelUp": {
        const levels =
          encounter.content.masters[encounter.master.definitionId].levels!;
        if (
          encounter.master.level === 1 &&
          encounter.master.masteryCardIds.length >= levels[0].masteryThreshold
        ) {
          encounter.master.discard.push(...encounter.master.masteryCardIds);
          encounter.master.masteryCardIds = [];
          encounter.master.level = 2;
          next.log.push("Le Maître passe au niveau 2.");
        }
        break;
      }
      case "minions": {
        const prepared = Object.values(encounter.minions).filter(
          (minion) =>
            !minion.defeated &&
            !minion.exhausted &&
            minion.zoneOwnerId === step.zoneOwnerId,
        );
        if (prepared.length) {
          encounter.steps.unshift(step);
          if (prepared.length > 1)
            requestChoice(
              next,
              "minionOrder",
              prepared.map((minion) => minion.id),
            );
          else activateMinion(next, prepared[0].id);
        }
        break;
      }
      case "attack":
        next = resolveAttack(next);
        break;
      case "hazards":
        for (const hazard of Object.values(encounter.hazards).reverse()) {
          if (!hazard.active || hazard.zoneOwnerId !== next.activePlayerId)
            continue;
          const definition = encounter.content.hazards[hazard.definitionId];
          if (definition.trigger === step.trigger)
            encounter.steps.unshift(...effectSteps(definition.effects ?? []));
        }
        break;
      case "finish":
        for (const minion of Object.values(encounter.minions)) {
          if (
            minion.zoneOwnerId === next.activePlayerId ||
            minion.zoneOwnerId === "master"
          )
            minion.exhausted = false;
        }
        encounter.master.combat = 0;
        for (const hazard of Object.values(encounter.hazards)) {
          if (
            !hazard.active ||
            hazard.zoneOwnerId !== next.activePlayerId ||
            hazard.remainingDuration === null
          )
            continue;
          hazard.remainingDuration--;
          if (hazard.remainingDuration === 0) {
            hazard.active = false;
            if (hazard.sourceCardId)
              encounter.master.discard.push(hazard.sourceCardId);
          }
        }
        next.phase = "main";
        next.log.push(`Tour ${next.turnNumber} : phase du héros.`);
        break;
    }
    updateCampaignOutcome(next);
  }
  return next;
}

export function beginMasterTurn(game: GameState): GameState {
  if (
    game.status !== "playing" ||
    !game.campaignEncounter ||
    game.campaignEncounter.progress.status !== "inProgress"
  ) {
    throw new Error("Aucune rencontre en cours.");
  }
  if (game.playerOrder.length !== 1)
    throw new Error("Seules les rencontres solo sont jouables pour le moment.");
  const next = structuredClone(game);
  const encounter = next.campaignEncounter!;
  if (
    encounter.steps.length ||
    encounter.pendingChoice ||
    next.resolution.pendingChoice
  )
    throw new Error("Une résolution est déjà en attente.");
  const level =
    encounter.content.masters[encounter.master.definitionId].levels?.[
      encounter.master.level - 1
    ];
  if (!level)
    throw new Error("Les capacités du Maître ne sont pas renseignées.");
  next.phase = "master";
  encounter.progress.round = next.turnNumber;
  encounter.master.combat = 0;
  encounter.revealedCardIds = [];
  const abilities: MasterStep[] = [];
  const cards: MasterStep[] = [];
  const random = createSeededRandom(next.randomState);
  for (let index = 0; index < level.cardsPerTurn; index++) {
    if (!encounter.master.deck.length) {
      encounter.master.deck = shuffle(encounter.master.discard, random);
      encounter.master.discard = [];
    }
    const cardId = encounter.master.deck.pop();
    if (!cardId) break;
    const card = encounter.content.masterCards?.[cardId];
    if (!card) throw new Error(`Carte du Maître inconnue : ${cardId}.`);
    encounter.revealedCardIds.push(cardId);
    abilities.push(
      ...effectSteps(level.abilities[card.faction ?? level.favoredFaction]),
    );
    cards.push({ type: "card", cardId });
  }
  next.randomState = random.getState();
  encounter.steps = [
    ...(next.turnNumber === 1
      ? [{ type: "hazards" as const, trigger: "onEncounterStart" as const }]
      : []),
    { type: "hazards", trigger: "onMasterTurnStart" },
    ...abilities,
    ...cards,
    { type: "levelUp" },
    { type: "minions", zoneOwnerId: next.activePlayerId },
    { type: "minions", zoneOwnerId: "master" },
    { type: "attack" },
    { type: "hazards", trigger: "onMasterTurnEnd" },
    { type: "hazards", trigger: "onHeroTurnStart" },
    { type: "finish" },
  ];
  next.log.push(
    `Tour ${next.turnNumber} : étape du Maître (niveau ${encounter.master.level}).`,
  );
  return processMasterTurn(next);
}

export function resolveMasterChoice(
  game: GameState,
  playerId: string,
  choiceId: string,
  selectedId: string,
): GameState {
  const choice = game.campaignEncounter?.pendingChoice;
  if (
    game.status !== "playing" ||
    game.phase !== "master" ||
    playerId !== game.activePlayerId ||
    !choice ||
    choice.id !== choiceId ||
    !choice.availableIds.includes(selectedId)
  ) {
    throw new Error("Choix du Maître invalide.");
  }
  let next = structuredClone(game);
  next.campaignEncounter!.pendingChoice = null;
  if (choice.kind === "minionOrder") activateMinion(next, selectedId);
  else next = attackChampion(next, selectedId);
  return processMasterTurn(next);
}
