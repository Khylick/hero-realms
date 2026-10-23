import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createHeroGame,
  createHeroProfile,
  customizeHero,
  getHeroPreview,
  validateGameState,
  validateHeroGameContent,
} from "../core";

import {
  demoHeroGameContent,
} from "../../game-content/demo-hero-game-content";

function createFighterProfile() {
  return createHeroProfile({
    id: "fighter-1",
    name: "Arthas",
    characterClass: "fighter",
  });
}

function createWizardProfile() {
  return createHeroProfile({
    id: "wizard-1",
    name: "Merlin",
    characterClass: "wizard",
  });
}

describe("Hero game integration", () => {
  it("valide le contenu de démonstration", () => {
    expect(
      validateHeroGameContent(demoHeroGameContent),
    ).toEqual([]);
  });

  it("détecte une carte de départ inconnue", () => {
    const content = structuredClone(
      demoHeroGameContent,
    );

    content.classDefinitions.fighter.startingDeck.push(
      "unknown-card",
    );

    expect(
      validateHeroGameContent(content),
    ).toContain(
      "Carte de départ inconnue : unknown-card.",
    );
  });

  it("détecte un pouvoir de progression inconnu", () => {
    const content = structuredClone(
      demoHeroGameContent,
    );

    content.classProgressions.fighter!.levels[1]
      .unlockedPowerIds.push("unknown-power");

    expect(
      validateHeroGameContent(content),
    ).toContain(
      "Pouvoir de progression inconnu : unknown-power.",
    );
  });

  it("crée une partie solo avec un héros", () => {
    const game = createHeroGame({
      id: "solo-game",
      mode: "solo",
      profiles: [createFighterProfile()],
      content: demoHeroGameContent,
      seed: 42,
    });

    expect(game.status).toBe("setup");
    expect(game.mode).toBe("solo");

    expect(game.playerOrder).toEqual([
      "fighter-1",
    ]);

    expect(game.players["fighter-1"].level).toBe(1);

    expect(
      game.players["fighter-1"].zones.deck,
    ).toHaveLength(10);

    expect(validateGameState(game)).toEqual([]);
  });

  it("crée une partie avec plusieurs classes", () => {
    const game = createHeroGame({
      id: "local-game",
      mode: "local",
      profiles: [
        createFighterProfile(),
        createWizardProfile(),
      ],
      content: demoHeroGameContent,
      seed: 42,
    });

    expect(game.playerOrder).toEqual([
      "fighter-1",
      "wizard-1",
    ]);

    expect(
      game.players["fighter-1"].characterClass,
    ).toBe("fighter");

    expect(
      game.players["wizard-1"].characterClass,
    ).toBe("wizard");

    expect(
      game.players["fighter-1"].zones.deck,
    ).toHaveLength(10);

    expect(
      game.players["wizard-1"].zones.deck,
    ).toHaveLength(10);

    expect(validateGameState(game)).toEqual([]);
  });

  it("produit le même état avec la même seed", () => {
    const profiles = [
      createFighterProfile(),
      createWizardProfile(),
    ];

    const first = createHeroGame({
      id: "same-game",
      mode: "local",
      profiles,
      content: demoHeroGameContent,
      seed: 123,
    });

    const second = createHeroGame({
      id: "same-game",
      mode: "local",
      profiles,
      content: demoHeroGameContent,
      seed: 123,
    });

    expect(first).toEqual(second);
  });

  it("ne modifie pas les profils fournis", () => {
    const profiles = [
      createFighterProfile(),
      createWizardProfile(),
    ];

    const snapshot = structuredClone(profiles);

    createHeroGame({
      id: "immutable-game",
      mode: "local",
      profiles,
      content: demoHeroGameContent,
    });

    expect(profiles).toEqual(snapshot);
  });

  it("isole les registres entre deux parties", () => {
    const first = createHeroGame({
      id: "first",
      mode: "solo",
      profiles: [createFighterProfile()],
      content: demoHeroGameContent,
    });

    const second = createHeroGame({
      id: "second",
      mode: "solo",
      profiles: [createFighterProfile()],
      content: demoHeroGameContent,
    });

    first.powerDefinitions["fighter-battle-stance"] = {
      ...first.powerDefinitions["fighter-battle-stance"],
      cost: {
        type: "gold",
        amount: 2,
      },
    };

    expect(
      second.powerDefinitions["fighter-battle-stance"].cost,
    ).toEqual({ type: "none" });

    expect(
      demoHeroGameContent.powerDefinitions[
        "fighter-battle-stance"
      ].cost,
    ).toEqual({ type: "none" });
  });

  it("refuse deux héros avec le même identifiant", () => {
    const first = createFighterProfile();

    const second = {
      ...createWizardProfile(),
      id: first.id,
    };

    expect(() =>
      createHeroGame({
        id: "invalid-game",
        mode: "local",
        profiles: [first, second],
        content: demoHeroGameContent,
      }),
    ).toThrow(
      "Deux héros ne peuvent pas partager le même identifiant.",
    );
  });

  it("refuse un profil avec un niveau incohérent", () => {
    const profile = {
      ...createFighterProfile(),
      experience: 25,
      level: 1,
    };

    expect(() =>
      createHeroGame({
        id: "invalid-level",
        mode: "solo",
        profiles: [profile],
        content: demoHeroGameContent,
      }),
    ).toThrow(
      "Le niveau du profil ne correspond pas à son expérience.",
    );
  });

  it("prévisualise un héros de niveau 1", () => {
    const preview = getHeroPreview(
      createFighterProfile(),
      demoHeroGameContent,
    );

    expect(preview.name).toBe("Arthas");
    expect(preview.level).toBe(1);
    expect(preview.maxHealth).toBe(50);
    expect(preview.deckSize).toBe(10);

    expect(preview.availablePowerIds).toContain(
      "fighter-battle-stance",
    );
  });

  it("prévisualise un héros évolué et personnalisé", () => {
    const profile = customizeHero(
      {
        ...createFighterProfile(),
        experience: 25,
        level: 3,
      },
      {
        additionalCardIds: ["dagger"],
        removedCardIds: ["gold"],
        selectedPowerIds: [],
      },
    );

    const preview = getHeroPreview(
      profile,
      demoHeroGameContent,
    );

    expect(preview.level).toBe(3);
    expect(preview.maxHealth).toBe(60);
    expect(preview.deckSize).toBe(10);

    expect(preview.availablePowerIds).toContain(
      "fighter-battle-cry",
    );
  });

  it("intègre la progression dans la partie", () => {
    const profile = {
      ...createFighterProfile(),
      experience: 30,
      level: 3,
    };

    const game = createHeroGame({
      id: "progressed-game",
      mode: "solo",
      profiles: [profile],
      content: demoHeroGameContent,
    });

    const player = game.players["fighter-1"];

    expect(player.experience).toBe(30);
    expect(player.level).toBe(3);
    expect(player.maxHealth).toBe(60);

    expect(
      player.powers.availablePowerIds,
    ).toContain("fighter-battle-cry");

    expect(validateGameState(game)).toEqual([]);
  });
});
