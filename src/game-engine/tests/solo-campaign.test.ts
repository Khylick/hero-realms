import { describe, expect, it } from "vitest";
import {
  applyAction,
  beginMasterTurn,
  canTargetCampaignMaster,
  canTargetCampaignMinion,
  createCard,
  enqueueEffects,
  validateGameState,
  type GameAction,
  type GameState,
  type PlayerClass,
} from "../core";
import { createSoloCampaign } from "../../game-content/create-solo-campaign";

function settle(game: GameState): GameState {
  let next = game;
  for (let limit = 0; limit < 100; limit++) {
    const masterChoice = next.campaignEncounter!.pendingChoice;
    const choice = next.resolution.pendingChoice;
    if (masterChoice)
      next = applyAction(next, {
        type: "RESOLVE_MASTER_CHOICE",
        playerId: "hero",
        choiceId: masterChoice.id,
        selectedId: masterChoice.availableIds[0],
      });
    else if (choice?.type === "selectCards")
      next = applyAction(next, {
        type: "RESOLVE_CHOICE",
        playerId: "hero",
        choiceId: choice.id,
        selectedCardIds: choice.availableCardIds.slice(0, choice.amount),
      });
    else if (choice?.type === "optionalAbility")
      next = applyAction(next, {
        type: "RESOLVE_OPTIONAL_ABILITY",
        playerId: "hero",
        choiceId: choice.id,
        accept: false,
      });
    else return next;
  }
  throw new Error("La résolution ne se termine pas.");
}

function quietGame(): GameState {
  const game = settle(createSoloCampaign("fighter", "Test", 42));
  const encounter = game.campaignEncounter!;
  encounter.minions = {};
  encounter.progress.minionIds = [];
  encounter.hazards = {};
  encounter.progress.hazardIds = [];
  encounter.content.masters[encounter.master.definitionId].levels!.forEach(
    (level) => {
      level.cardsPerTurn = 1;
      level.abilities = { imperial: [], guild: [], necros: [], wild: [] };
    },
  );
  encounter.content.masterCards!.strike.effects = [];
  encounter.master.deck = ["strike"];
  encounter.master.discard = [];
  return game;
}

function addChampion(
  game: GameState,
  id: string,
  defense: number,
  isGuard: boolean,
  exhausted = false,
) {
  game.cardDefinitions[id] = {
    id,
    name: id,
    type: "champion",
    cost: 0,
    defense,
    isGuard,
    abilities: [],
  };
  game.cards[id] = createCard({ id, definitionId: id, ownerId: "hero" });
  game.cards[id].exhausted = exhausted;
  game.players.hero.zones.champions.push(id);
}

describe("Solo campaign loop", () => {
  it.each<PlayerClass>(["cleric", "fighter", "ranger", "thief", "wizard"])(
    "initialise une rencontre complète pour %s",
    (characterClass) => {
      const game = settle(createSoloCampaign(characterClass, "Héros", 42));
      expect(game.format).toBe("campaign");
      expect(game.phase).toBe("main");
      expect(game.campaignEncounter!.progress.status).toBe("inProgress");
      expect(game.market.fireGems).toHaveLength(16);
      expect(game.players.hero.characterClass).toBe(characterClass);
      expect(game.players.hero.powers.availablePowerIds).toHaveLength(2);
      expect(game.log[0]).toMatch(/étape du Maître/);
      expect(validateGameState(game)).toEqual([]);
    },
  );

  it("suspend l'étape du Maître pour une défausse et la reprend après le choix", () => {
    const game = quietGame();
    const encounter = game.campaignEncounter!;
    encounter.master.deck = ["curse"];
    encounter.content.masters[
      encounter.master.definitionId
    ].levels![0].abilities.wild = [{ type: "discardHero", amount: 1 }];
    const before = structuredClone(game);
    const next = beginMasterTurn(game);
    expect(next.phase).toBe("master");
    expect(next.resolution.pendingChoice?.type).toBe("selectCards");
    expect(Object.values(next.campaignEncounter!.hazards)).toHaveLength(0);
    expect(() =>
      applyAction(next, { type: "END_TURN", playerId: "hero" }),
    ).toThrow(/choix/);
    const resolved = settle(next);
    expect(resolved.phase).toBe("main");
    expect(resolved.players.hero.zones.hand.length).toBe(
      game.players.hero.zones.hand.length - 1,
    );
    expect(Object.values(resolved.campaignEncounter!.hazards)).toHaveLength(1);
    expect(game).toEqual(before);
    expect(validateGameState(resolved)).toEqual([]);
  });

  it("résout les capacités révélées avant les cartes, puis monte de niveau", () => {
    const game = quietGame();
    const encounter = game.campaignEncounter!;
    const level =
      encounter.content.masters[encounter.master.definitionId].levels![0];
    level.cardsPerTurn = 2;
    level.abilities.necros = [{ type: "damageHero", amount: 2 }];
    level.abilities.guild = [{ type: "damageHero", amount: 3 }];
    encounter.master.deck = ["strike", "mastery"];
    encounter.master.masteryCardIds = ["mastery", "mastery"];
    const next = settle(beginMasterTurn(game));
    expect(next.players.hero.health).toBe(game.players.hero.health - 5);
    expect(next.campaignEncounter!.master.level).toBe(2);
    expect(next.campaignEncounter!.master.masteryCardIds).toEqual([]);
    const messages = next.log.slice(game.log.length);
    expect(messages[1]).toMatch(/2 dégâts directs/);
    expect(messages[2]).toMatch(/3 dégâts directs/);
    expect(messages[3]).toMatch(/révèle/);
  });

  it("laisse choisir l'ordre des sbires et bloque les autres actions", () => {
    const game = quietGame();
    const encounter = game.campaignEncounter!;
    encounter.content.masterCards!.strike.effects = [
      { type: "summonMinion", definitionId: "cultist" },
      { type: "summonMinion", definitionId: "skeleton" },
    ];
    const next = beginMasterTurn(game);
    const choice = next.campaignEncounter!.pendingChoice!;
    expect(choice.kind).toBe("minionOrder");
    expect(choice.availableIds).toHaveLength(2);
    expect(() =>
      applyAction(next, { type: "END_TURN", playerId: "hero" }),
    ).toThrow(/choix du Maître/);
    expect(() =>
      applyAction(next, {
        type: "RESOLVE_MASTER_CHOICE",
        playerId: "intruder",
        choiceId: choice.id,
        selectedId: choice.availableIds[0],
      }),
    ).toThrow();
    const resolved = settle(next);
    expect(resolved.players.hero.health).toBe(game.players.hero.health - 3);
    expect(
      Object.values(resolved.campaignEncounter!.minions).every(
        (minion) => !minion.exhausted,
      ),
    ).toBe(true);
  });

  it("dépense le combat sur les gardes les plus résistants qu'il peut assommer", () => {
    const game = quietGame();
    addChampion(game, "guard-7", 7, true);
    addChampion(game, "guard-5", 5, true);
    addChampion(game, "guard-3", 3, true);
    game.campaignEncounter!.content.masterCards!.strike.effects = [
      { type: "gainCombat", amount: 10 },
    ];
    const next = beginMasterTurn(game);
    expect(next.players.hero.zones.champions).toEqual(["guard-5"]);
    expect(next.players.hero.health).toBe(game.players.hero.health);
    expect(next.campaignEncounter!.master.combat).toBe(0);
  });

  it("fait choisir la cible en cas d'égalité de défense", () => {
    const game = quietGame();
    addChampion(game, "guard-a", 5, true);
    addChampion(game, "guard-b", 5, true);
    game.campaignEncounter!.content.masterCards!.strike.effects = [
      { type: "gainCombat", amount: 5 },
    ];
    const next = beginMasterTurn(game);
    const choice = next.campaignEncounter!.pendingChoice!;
    expect(choice.kind).toBe("attackTarget");
    const resolved = applyAction(next, {
      type: "RESOLVE_MASTER_CHOICE",
      playerId: "hero",
      choiceId: choice.id,
      selectedId: "guard-b",
    });
    expect(resolved.players.hero.zones.champions).toEqual(["guard-a"]);
    expect(resolved.phase).toBe("main");
  });

  it("ignore les gardes épuisés et préfère une attaque létale aux autres champions", () => {
    const game = quietGame();
    addChampion(game, "expended-guard", 5, true, true);
    addChampion(game, "champion", 7, false);
    game.players.hero.health = 8;
    game.campaignEncounter!.content.masterCards!.strike.effects = [
      { type: "gainCombat", amount: 8 },
    ];
    const next = beginMasterTurn(game);
    expect(next.status).toBe("defeat");
    expect(next.phase).toBe("ended");
    expect(next.players.hero.zones.champions).toEqual([
      "expended-guard",
      "champion",
    ]);
    expect(validateGameState(next)).toEqual([]);
  });

  it("réinitialise les blessures des sbires entre les tours", () => {
    const game = quietGame();
    game.campaignEncounter!.content.masterCards!.strike.effects = [
      { type: "summonMinion", definitionId: "skeleton" },
    ];
    let next = beginMasterTurn(game);
    const minionId = next.campaignEncounter!.progress.minionIds[0];
    next.players.hero.resources.combat = 2;
    next = applyAction(next, {
      type: "ATTACK_CAMPAIGN_MINION",
      playerId: "hero",
      minionId,
      combat: 2,
    });
    expect(next.campaignEncounter!.minions[minionId].health).toBe(2);
    next.campaignEncounter!.content.masterCards!.strike.effects = [];
    next = settle(applyAction(next, { type: "END_TURN", playerId: "hero" }));
    expect(next.campaignEncounter!.minions[minionId].health).toBe(4);
  });

  it("applique la portée locale et les gardes seulement dans leur zone", () => {
    const game = quietGame();
    game.campaignEncounter!.content.masterCards!.strike.effects = [
      { type: "summonMinion", definitionId: "cultist" },
    ];
    const next = beginMasterTurn(game);
    const encounter = next.campaignEncounter!;
    const id = encounter.progress.minionIds[0];
    expect(canTargetCampaignMaster(encounter, "hero")).toBe(false);
    expect(canTargetCampaignMinion(encounter, id, "hero")).toBe(true);
    encounter.minions[id].exhausted = true;
    expect(canTargetCampaignMaster(encounter, "hero")).toBe(true);
    encounter.minions[id].zoneOwnerId = "distant-player";
    expect(canTargetCampaignMinion(encounter, id, "hero")).toBe(false);
  });

  it("dissipe un danger en payant son coût et le renvoie à la défausse du Maître", () => {
    const game = quietGame();
    game.campaignEncounter!.master.deck = ["curse"];
    const next = beginMasterTurn(game);
    const id = next.campaignEncounter!.progress.hazardIds[0];
    next.players.hero.resources.gold = 2;
    const resolved = applyAction(next, {
      type: "CLEAR_HAZARD",
      playerId: "hero",
      hazardId: id,
    });
    expect(resolved.campaignEncounter!.hazards[id].active).toBe(false);
    expect(resolved.players.hero.resources.gold).toBe(0);
    expect(resolved.campaignEncounter!.master.discard).toContain("curse");
  });

  it("termine la rencontre quand le Maître tombe et refuse ensuite toute action", () => {
    const game = quietGame();
    game.players.hero.resources.combat = 40;
    const next = applyAction(game, {
      type: "ATTACK_CAMPAIGN_MASTER",
      playerId: "hero",
      combat: 40,
    });
    expect(next.status).toBe("victory");
    expect(next.campaignEncounter!.progress.status).toBe("victory");
    expect(next.phase).toBe("ended");
    expect(() =>
      applyAction(next, { type: "END_TURN", playerId: "hero" }),
    ).toThrow(/terminée/);
    expect(game.status).toBe("playing");
  });

  it("réutilise une Gemme de feu après activation de sa capacité de sacrifice", () => {
    const game = quietGame();
    game.players.hero.resources.gold = 2;
    const gem = game.market.fireGems[0];
    let next = applyAction(game, {
      type: "BUY_CARD",
      playerId: "hero",
      cardId: gem,
    });
    expect(next.market.row).toEqual(game.market.row);
    next.players.hero.zones.discard = next.players.hero.zones.discard.filter(
      (id) => id !== gem,
    );
    next.players.hero.zones.hand.push(gem);
    next = applyAction(next, {
      type: "PLAY_CARD",
      playerId: "hero",
      cardId: gem,
    });
    next = applyAction(next, {
      type: "SACRIFICE_CARD",
      playerId: "hero",
      cardId: gem,
      abilityId: "fire-gem-sacrifice",
    });
    expect(next.market.fireGems).toHaveLength(16);
    expect(next.players.hero.resources.combat).toBe(3);
    expect(next.players.hero.resources.gold).toBe(2);
    expect(next.cards[gem].ownerId).toBeNull();
    expect(validateGameState(next)).toEqual([]);
    expect(() =>
      applyAction(next, {
        type: "SACRIFICE_CARD",
        playerId: "hero",
        cardId: gem,
        abilityId: "fire-gem-sacrifice",
      }),
    ).toThrow();
  });

  it("retourne une Gemme éliminée par un effet sans déclencher sa capacité", () => {
    const game = quietGame();
    const gem = game.market.fireGems.pop()!;
    game.cards[gem].ownerId = "hero";
    game.players.hero.zones.hand.push(gem);
    const pending = enqueueEffects(
      game,
      { playerId: "hero", sourceCardId: "test", abilityId: "purge" },
      [{ type: "chooseCard", from: "hand", action: "sacrifice", amount: 1 }],
    );
    const next = applyAction(pending, {
      type: "RESOLVE_CHOICE",
      playerId: "hero",
      choiceId: pending.resolution.pendingChoice!.id,
      selectedCardIds: [gem],
    });
    expect(next.market.fireGems).toHaveLength(16);
    expect(next.players.hero.resources.combat).toBe(0);
    expect(validateGameState(next)).toEqual([]);
  });

  it("recycle seulement les cartes sacrifiées provenant du marché", () => {
    const game = quietGame();
    const card = game.market.row[0];
    game.players.hero.resources.gold = 10;
    const bought = applyAction(game, {
      type: "BUY_CARD",
      playerId: "hero",
      cardId: card,
    });
    const pending = enqueueEffects(
      bought,
      { playerId: "hero", sourceCardId: "test", abilityId: "purge" },
      [{ type: "chooseCard", from: "discard", action: "sacrifice", amount: 1 }],
    );
    const next = applyAction(pending, {
      type: "RESOLVE_CHOICE",
      playerId: "hero",
      choiceId: pending.resolution.pendingChoice!.id,
      selectedCardIds: [card],
    });
    expect(next.market.sacrificed).toContain(card);
    expect(next.cards[card].ownerId).toBeNull();
    expect(next.players.hero.zones.sacrificed).not.toContain(card);
    expect(validateGameState(next)).toEqual([]);
  });

  it.each<PlayerClass>(["cleric", "fighter", "ranger", "thief", "wizard"])(
    "rejoue exactement une rencontre complète avec %s",
    (characterClass) => {
      const initial = createSoloCampaign(characterClass, "Replay", 19);
      const snapshot = structuredClone(initial);
      const actions: GameAction[] = [];
      let game = initial;
      function act(action: GameAction) {
        actions.push(action);
        game = applyAction(game, action);
        expect(validateGameState(game)).toEqual([]);
      }
      for (let limit = 0; limit < 2000 && game.status === "playing"; limit++) {
        const encounter = game.campaignEncounter!;
        const player = game.players.hero;
        const masterChoice = encounter.pendingChoice;
        const choice = game.resolution.pendingChoice;
        if (masterChoice)
          act({
            type: "RESOLVE_MASTER_CHOICE",
            playerId: "hero",
            choiceId: masterChoice.id,
            selectedId: masterChoice.availableIds[0],
          });
        else if (choice?.type === "selectCards")
          act({
            type: "RESOLVE_CHOICE",
            playerId: "hero",
            choiceId: choice.id,
            selectedCardIds: choice.availableCardIds.slice(0, choice.amount),
          });
        else if (choice?.type === "optionalAbility")
          act({
            type: "RESOLVE_OPTIONAL_ABILITY",
            playerId: "hero",
            choiceId: choice.id,
            accept: false,
          });
        else if (player.zones.hand.length)
          act({
            type: "PLAY_CARD",
            playerId: "hero",
            cardId: player.zones.hand[0],
          });
        else {
          const usable = player.powers.availablePowerIds.find(
            (id) =>
              !player.powers.usedThisTurn.includes(id) &&
              !player.powers.usedThisEncounter.includes(id),
          );
          if (usable) {
            act({
              type: "USE_CHARACTER_POWER",
              playerId: "hero",
              powerId: usable,
            });
            continue;
          }
          const champion = player.zones.champions.find(
            (id) => !game.cards[id].exhausted,
          );
          if (champion) {
            act({
              type: "USE_CHAMPION",
              playerId: "hero",
              cardId: champion,
              abilityId:
                game.cardDefinitions[game.cards[champion].definitionId]
                  .abilities[0].id,
            });
            continue;
          }
          const minion = Object.values(encounter.minions).find(
            (item) =>
              canTargetCampaignMinion(encounter, item.id, "hero") &&
              item.health <= player.resources.combat,
          );
          if (minion) {
            act({
              type: "ATTACK_CAMPAIGN_MINION",
              playerId: "hero",
              minionId: minion.id,
              combat: minion.health,
            });
            continue;
          }
          if (
            player.resources.combat &&
            canTargetCampaignMaster(encounter, "hero")
          ) {
            act({
              type: "ATTACK_CAMPAIGN_MASTER",
              playerId: "hero",
              combat: player.resources.combat,
            });
            continue;
          }
          const purchase = game.market.row.find(
            (id) =>
              game.cardDefinitions[game.cards[id].definitionId].cost <=
              player.resources.gold,
          );
          if (purchase) {
            act({ type: "BUY_CARD", playerId: "hero", cardId: purchase });
            continue;
          }
          act({ type: "END_TURN", playerId: "hero" });
        }
      }
      expect(["victory", "defeat"]).toContain(game.status);
      if (characterClass === "fighter") expect(game.status).toBe("victory");
      const replayed = actions.reduce(
        applyAction,
        createSoloCampaign(characterClass, "Replay", 19),
      );
      expect(replayed).toEqual(game);
      expect(initial).toEqual(snapshot);
    },
  );
});
