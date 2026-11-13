import { describe, expect, it } from "vitest";

import {
  applyAction,
  createGame,
  createMarket,
  createCard,
  createPlayer,
  createSeededRandom,
  createStartingDeck,
  validateGameState,
  type GameState,
  areAbilityConditionsMet,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

function makeGame(): GameState {
  const player = createPlayer({
    id: "player-1",
    name: "Héros",
    characterClass: "fighter",
  });

  const deckResult = createStartingDeck(
    player,
    [
      "tacticalScroll",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
      "gold",
    ],
    createSeededRandom(42),
  );

  const game = createGame({
    id: "game-effects",
    mode: "solo",
    players: [deckResult.player],
    cardDefinitions: demoCards,
    seed: 123,
  });

  game.cardDefinitions = structuredClone(demoCards);
  game.cards = deckResult.cards;

  return createMarket(
    game,
    Array(10).fill("dagger"),
  );
}

function prepareScrollGame(): {
  game: GameState;
  scrollId: string;
} {
  let game = applyAction(makeGame(), {
    type: "START_GAME",
  });

  const player = game.players["player-1"];

  const scrollId = Object.keys(game.cards).find(
    (id) =>
      game.cards[id].definitionId ===
      "tacticalScroll",
  );

  if (!scrollId) {
    throw new Error("Parchemin introuvable.");
  }

  // Nous préparons une main contrôlée pour ce test.
  // Le parchemin doit être jouable immédiatement.
  if (!player.zones.hand.includes(scrollId)) {
    const deck = [...player.zones.deck];
    const index = deck.indexOf(scrollId);

    if (index === -1) {
      throw new Error("Parchemin absent du deck.");
    }

    const replaced = player.zones.hand[0];

    deck.splice(index, 1);
    deck.push(replaced);

    game = structuredClone(game);

    game.players["player-1"].zones.deck = deck;

    game.players["player-1"].zones.hand = [
      scrollId,
      ...player.zones.hand.slice(1),
    ];
  }

  return { game, scrollId };
}

describe("Effect queue", () => {
  it("évalue les conditions de faction, de vie et de champions", () => {
    const { game } = prepareScrollGame();
    const player = game.players["player-1"];
    const [factionCardId, championCardId] =
      player.zones.hand.slice(0, 2);

    game.cards[factionCardId].definitionId = "runicBlade";
    player.zones.hand = player.zones.hand.filter(
      (id) => id !== factionCardId && id !== championCardId,
    );
    player.zones.inPlay.push(factionCardId);

    game.cards[championCardId].definitionId = "royalGuard";
    player.zones.champions.push(championCardId);

    expect(
      areAbilityConditionsMet(game, "player-1", [
        {
          type: "hasFactionInPlay",
          faction: "imperial",
          minimum: 1,
        },
        { type: "healthBelow", amount: 51 },
        { type: "hasChampionInPlay", minimum: 1 },
      ]),
    ).toBe(true);

    expect(
      areAbilityConditionsMet(game, "player-1", [
        { type: "healthBelow", amount: 50 },
      ]),
    ).toBe(false);
  });

  it("ignore une capacité de carte dont la condition n'est pas remplie", () => {
    const { game, scrollId } = prepareScrollGame();
    game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "conditional-play",
        trigger: "onPlay",
        conditions: [
          { type: "healthBelow", amount: 40 },
        ],
        effects: [{ type: "gainCombat", amount: 3 }],
      },
    ];

    const updated = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    expect(updated.players["player-1"].resources.combat).toBe(0);
    expect(updated.resolution.pendingChoice).toBeNull();
  });

  it("évalue les conditions après avoir mis la carte en jeu", () => {
    const { game, scrollId } = prepareScrollGame();
    game.cardDefinitions.tacticalScroll.faction = "imperial";
    game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "faction-play",
        trigger: "onPlay",
        conditions: [
          {
            type: "hasFactionInPlay",
            faction: "imperial",
            minimum: 1,
          },
        ],
        effects: [{ type: "gainCombat", amount: 2 }],
      },
    ];

    const updated = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    expect(updated.players["player-1"].resources.combat).toBe(2);
  });

  it("permet d'accepter ou de refuser une capacité de carte optionnelle", () => {
    const { game, scrollId } = prepareScrollGame();
    game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "optional-play",
        trigger: "onPlay",
        optional: true,
        effects: [{ type: "gainCombat", amount: 4 }],
      },
      {
        id: "required-play",
        trigger: "onPlay",
        effects: [{ type: "gainGold", amount: 1 }],
      },
    ];

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });
    const choice = suspended.resolution.pendingChoice;

    if (!choice || choice.type !== "optionalAbility") {
      throw new Error("Choix de capacité optionnelle attendu.");
    }

    const declined = applyAction(suspended, {
      type: "RESOLVE_OPTIONAL_ABILITY",
      playerId: "player-1",
      choiceId: choice.id,
      accept: false,
    });

    expect(declined.players["player-1"].resources.combat).toBe(0);
    expect(declined.players["player-1"].resources.gold).toBe(1);
    expect(declined.resolution.pendingChoice).toBeNull();

    const acceptedStart = prepareScrollGame();
    acceptedStart.game.cardDefinitions.tacticalScroll.abilities =
      structuredClone(game.cardDefinitions.tacticalScroll.abilities);

    const acceptedPending = applyAction(acceptedStart.game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: acceptedStart.scrollId,
    });
    const acceptedChoice = acceptedPending.resolution.pendingChoice;

    if (
      !acceptedChoice ||
      acceptedChoice.type !== "optionalAbility"
    ) {
      throw new Error("Choix de capacité optionnelle attendu.");
    }

    const accepted = applyAction(acceptedPending, {
      type: "RESOLVE_OPTIONAL_ABILITY",
      playerId: "player-1",
      choiceId: acceptedChoice.id,
      accept: true,
    });

    expect(accepted.players["player-1"].resources.combat).toBe(4);
    expect(accepted.players["player-1"].resources.gold).toBe(1);
    expect(accepted.resolution.pendingChoice).toBeNull();
  });

  it("résout les effets personnels de défausse, sacrifice et étourdissement", () => {
    const discardScenario = prepareScrollGame();
    discardScenario.game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "discard-self",
        trigger: "onPlay",
        effects: [
          { type: "discardCards", amount: 1, target: "self" },
        ],
      },
    ];
    const discardPending = applyAction(
      discardScenario.game,
      {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: discardScenario.scrollId,
      },
    );
    const discardChoice = discardPending.resolution.pendingChoice;

    if (
      !discardChoice ||
      discardChoice.type !== "selectCards"
    ) {
      throw new Error("Choix de défausse attendu.");
    }

    const discardedId = discardChoice.availableCardIds[0];
    const discarded = applyAction(discardPending, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: discardChoice.id,
      selectedCardIds: [discardedId],
    });

    expect(discarded.players["player-1"].zones.discard).toContain(
      discardedId,
    );

    const sacrificeScenario = prepareScrollGame();
    sacrificeScenario.game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "sacrifice-self",
        trigger: "onPlay",
        effects: [{ type: "sacrificeCard", target: "self" }],
      },
    ];
    const sacrificePending = applyAction(
      sacrificeScenario.game,
      {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: sacrificeScenario.scrollId,
      },
    );
    const sacrificeChoice =
      sacrificePending.resolution.pendingChoice;

    if (
      !sacrificeChoice ||
      sacrificeChoice.type !== "selectCards"
    ) {
      throw new Error("Choix de sacrifice attendu.");
    }

    const sacrificedId = sacrificeChoice.availableCardIds[0];
    const sacrificed = applyAction(sacrificePending, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: sacrificeChoice.id,
      selectedCardIds: [sacrificedId],
    });

    expect(sacrificed.players["player-1"].zones.sacrificed).toContain(
      sacrificedId,
    );

    const stunScenario = prepareScrollGame();
    stunScenario.game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "stun-self",
        trigger: "onPlay",
        effects: [{ type: "stunChampion", target: "self" }],
      },
    ];
    stunScenario.game.cards["guard-1"] = createCard({
      id: "guard-1",
      definitionId: "royalGuard",
      ownerId: "player-1",
    });
    stunScenario.game.players["player-1"].zones.champions.push(
      "guard-1",
    );

    const stunPending = applyAction(
      stunScenario.game,
      {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: stunScenario.scrollId,
      },
    );
    const stunChoice = stunPending.resolution.pendingChoice;

    if (!stunChoice || stunChoice.type !== "selectCards") {
      throw new Error("Choix de champion attendu.");
    }

    const stunned = applyAction(stunPending, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: stunChoice.id,
      selectedCardIds: ["guard-1"],
    });

    expect(stunned.players["player-1"].zones.champions).not.toContain(
      "guard-1",
    );
    expect(stunned.players["player-1"].zones.discard).toContain(
      "guard-1",
    );
  });

  it("refuse explicitement les cibles non représentées", () => {
    const { game, scrollId } = prepareScrollGame();
    game.cardDefinitions.tacticalScroll.abilities = [
      {
        id: "stun-enemy",
        trigger: "onPlay",
        effects: [{ type: "stunChampion", target: "enemy" }],
      },
    ];

    expect(() =>
      applyAction(game, {
        type: "PLAY_CARD",
        playerId: "player-1",
        cardId: scrollId,
      }),
    ).toThrow('La cible "enemy" de l\'effet stunChampion');
  });

  it("suspend une capacité lorsqu'un choix est nécessaire", () => {
    const { game, scrollId } = prepareScrollGame();

    const updated = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const player = updated.players["player-1"];

    expect(player.resources.combat).toBe(2);
    expect(player.resources.gold).toBe(0);

    expect(
      updated.resolution.pendingChoice,
    ).not.toBeNull();

    expect(updated.resolution.queue).toHaveLength(1);
    expect(validateGameState(updated)).toEqual([]);
  });

  it("reprend la résolution après le choix", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const choice = suspended.resolution.pendingChoice;

    if (!choice || choice.type !== "selectCards") {
      throw new Error("Choix attendu.");
    }

    const selectedCardId = choice.availableCardIds[0];

    const resumed = applyAction(suspended, {
      type: "RESOLVE_CHOICE",
      playerId: "player-1",
      choiceId: choice.id,
      selectedCardIds: [selectedCardId],
    });

    expect(
      resumed.resolution.pendingChoice,
    ).toBeNull();

    expect(resumed.resolution.queue).toHaveLength(0);

    expect(
      resumed.players["player-1"].resources.gold,
    ).toBe(1);

    expect(
      resumed.players["player-1"].zones.discard,
    ).toContain(selectedCardId);

    expect(validateGameState(resumed)).toEqual([]);
  });

  it("interdit de terminer le tour pendant un choix", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    expect(() =>
      applyAction(suspended, {
        type: "END_TURN",
        playerId: "player-1",
      }),
    ).toThrow(
      "Un choix doit être résolu",
    );
  });

  it("refuse une réponse provenant d'un autre joueur", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const choice = suspended.resolution.pendingChoice;

    if (!choice || choice.type !== "selectCards") {
      throw new Error("Choix attendu.");
    }

    expect(() =>
      applyAction(suspended, {
        type: "RESOLVE_CHOICE",
        playerId: "player-2",
        choiceId: choice.id,
        selectedCardIds: [choice.availableCardIds[0]],
      }),
    ).toThrow(
      "Ce choix appartient à un autre joueur.",
    );
  });

  it("refuse une carte qui ne fait pas partie du choix", () => {
    const { game, scrollId } = prepareScrollGame();

    const suspended = applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    const choice = suspended.resolution.pendingChoice;

    if (!choice || choice.type !== "selectCards") {
      throw new Error("Choix attendu.");
    }

    expect(() =>
      applyAction(suspended, {
        type: "RESOLVE_CHOICE",
        playerId: "player-1",
        choiceId: choice.id,
        selectedCardIds: ["unknown-card"],
      }),
    ).toThrow("Carte non autorisée");
  });

  it("ne modifie pas l'état initial", () => {
    const { game, scrollId } = prepareScrollGame();

    const snapshot = structuredClone(game);

    applyAction(game, {
      type: "PLAY_CARD",
      playerId: "player-1",
      cardId: scrollId,
    });

    expect(game).toEqual(snapshot);
  });

  
  it("reproduit une résolution identique", () => {
    const { game, scrollId } = prepareScrollGame();

    const action = {
      type: "PLAY_CARD" as const,
      playerId: "player-1",
      cardId: scrollId,
    };

    const first = applyAction(game, action);
    const second = applyAction(game, action);

    expect(first).toEqual(second);
    expect(first.randomState).toBe(second.randomState);
  });
});