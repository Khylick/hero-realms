
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyAction,
  buildCustomizedDeck,
  createClassGame,
  createHeroProfile,
  createSeededRandom,
  customizeHero,
  prepareHeroForEncounter,
  updateHeroProfile,
  validateGameState,
  type HeroProfile,
} from "../core";

import {
  demoClasses,
} from "../../game-content/classes/demo-classes";

import {
  demoCards,
} from "../../game-content/cards/demo-cards";

import {
  demoPowers,
} from "../../game-content/classes/demo-powers";

import {
  demoProgressions,
} from "../../game-content/classes/demo-progressions";

function prepareFighter(profile: HeroProfile) {
  return prepareHeroForEncounter({
    profile,
    classDefinition: demoClasses.fighter,
    progression: demoProgressions.fighter!,
    cardDefinitions: demoCards,
    powerDefinitions: demoPowers,
    random: createSeededRandom(42),
  });
}

describe("Hero preparation", () => {
  it("crée un profil de héros initial", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    expect(profile.id).toBe("hero-1");
    expect(profile.name).toBe("Arthas");
    expect(profile.characterClass).toBe("fighter");
    expect(profile.experience).toBe(0);
    expect(profile.level).toBe(1);

    expect(profile.customization).toEqual({
      additionalCardIds: [],
      removedCardIds: [],
      selectedPowerIds: [],
    });
  });

  it("refuse un nom vide", () => {
    expect(() =>
      createHeroProfile({
        id: "hero-1",
        name: "   ",
        characterClass: "fighter",
      }),
    ).toThrow(
      "Le nom du héros est obligatoire.",
    );
  });

  it("personnalise un profil sans modifier l'original", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    const customized = customizeHero(profile, {
      additionalCardIds: ["dagger"],
      removedCardIds: ["gold"],
      selectedPowerIds: [],
    });

    expect(
      customized.customization.additionalCardIds,
    ).toEqual(["dagger"]);

    expect(
      customized.customization.removedCardIds,
    ).toEqual(["gold"]);

    expect(profile.customization).toEqual({
      additionalCardIds: [],
      removedCardIds: [],
      selectedPowerIds: [],
    });
  });

  it("refuse un pouvoir sélectionné deux fois", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    expect(() =>
      customizeHero(profile, {
        additionalCardIds: [],
        removedCardIds: [],
        selectedPowerIds: [
          "fighter-battle-stance",
          "fighter-battle-stance",
        ],
      }),
    ).toThrow(
      "Un pouvoir ne peut pas être sélectionné deux fois.",
    );
  });

  it("construit un deck personnalisé", () => {
    const deck = buildCustomizedDeck(
      demoClasses.fighter.startingDeck,
      {
        additionalCardIds: ["dagger"],
        removedCardIds: ["gold"],
        selectedPowerIds: [],
      },
    );

    expect(deck).toHaveLength(10);

    expect(
      deck.filter((id) => id === "gold"),
    ).toHaveLength(4);

    expect(
      deck.filter((id) => id === "dagger"),
    ).toHaveLength(4);
  });

  it("refuse de retirer une carte absente du deck", () => {
    expect(() =>
      buildCustomizedDeck(
        demoClasses.fighter.startingDeck,
        {
          additionalCardIds: [],
          removedCardIds: ["unknown-card"],
          selectedPowerIds: [],
        },
      ),
    ).toThrow(
      "Impossible de retirer la carte unknown-card du deck.",
    );
  });

  it("prépare un héros de niveau 1", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    const hero = prepareFighter(profile);

    expect(hero.player.level).toBe(1);
    expect(hero.player.experience).toBe(0);
    expect(hero.player.maxHealth).toBe(50);
    expect(hero.player.health).toBe(50);

    expect(hero.player.zones.deck).toHaveLength(10);

    expect(
      hero.player.powers.availablePowerIds,
    ).toContain("fighter-battle-stance");
  });

  it("reconstitue les bonus d'un héros de niveau 3", () => {
    const profile = {
      ...createHeroProfile({
        id: "hero-1",
        name: "Arthas",
        characterClass: "fighter",
      }),
      experience: 30,
      level: 3,
    };

    const hero = prepareFighter(profile);

    expect(hero.player.level).toBe(3);
    expect(hero.player.experience).toBe(30);

    expect(hero.player.maxHealth).toBe(60);
    expect(hero.player.health).toBe(60);

    expect(
      hero.player.powers.availablePowerIds,
    ).toContain("fighter-battle-cry");
  });

  it("réinitialise les pouvoirs pour une nouvelle rencontre", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    const hero = prepareFighter(profile);

    expect(hero.player.powers.usedThisTurn).toEqual([]);
    expect(hero.player.powers.usedThisEncounter).toEqual([]);

    expect(hero.player.resources).toEqual({
      gold: 0,
      combat: 0,
    });

    expect(hero.player.zones.hand).toEqual([]);
    expect(hero.player.zones.discard).toEqual([]);
  });

  it("refuse un profil dont le niveau est incohérent", () => {
    const profile = {
      ...createHeroProfile({
        id: "hero-1",
        name: "Arthas",
        characterClass: "fighter",
      }),
      experience: 30,
      level: 1,
    };

    expect(() =>
      prepareFighter(profile),
    ).toThrow(
      "Le niveau du profil ne correspond pas à son expérience.",
    );
  });

  it("met à jour le profil après une rencontre", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    const hero = prepareFighter(profile);

    let game = createClassGame({
      id: "game-1",
      mode: "solo",
      heroes: [hero],
      cardDefinitions: demoCards,
      powerDefinitions: demoPowers,
      classProgressions: demoProgressions,
    });

    game.status = "playing";
    game.phase = "main";

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "hero-1",
      amount: 15,
    });

    const updatedProfile = updateHeroProfile(
      profile,
      game.players["hero-1"],
    );

    expect(updatedProfile.experience).toBe(15);
    expect(updatedProfile.level).toBe(2);

    expect(profile.experience).toBe(0);
    expect(profile.level).toBe(1);
  });

  it("refuse de mettre à jour le mauvais profil", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    const hero = prepareFighter(profile);

    const anotherProfile = createHeroProfile({
      id: "hero-2",
      name: "Autre héros",
      characterClass: "fighter",
    });

    expect(() =>
      updateHeroProfile(
        anotherProfile,
        hero.player,
      ),
    ).toThrow(
      "Le profil et le joueur ne correspondent pas.",
    );
  });

  it("conserve la progression entre deux rencontres", () => {
    const profile = createHeroProfile({
      id: "hero-1",
      name: "Arthas",
      characterClass: "fighter",
    });

    const firstHero = prepareFighter(profile);

    let game = createClassGame({
      id: "first-encounter",
      mode: "solo",
      heroes: [firstHero],
      cardDefinitions: demoCards,
      powerDefinitions: demoPowers,
      classProgressions: demoProgressions,
    });

    game.status = "playing";
    game.phase = "main";

    game = applyAction(game, {
      type: "GAIN_EXPERIENCE",
      playerId: "hero-1",
      amount: 25,
    });

    const updatedProfile = updateHeroProfile(
      profile,
      game.players["hero-1"],
    );

    const secondHero = prepareFighter(updatedProfile);

    expect(secondHero.player.level).toBe(3);
    expect(secondHero.player.experience).toBe(25);

    expect(secondHero.player.maxHealth).toBe(60);

    expect(
      secondHero.player.powers.availablePowerIds,
    ).toContain("fighter-battle-cry");

    expect(
      secondHero.player.powers.usedThisEncounter,
    ).toEqual([]);

    const secondGame = createClassGame({
      id: "second-encounter",
      mode: "solo",
      heroes: [secondHero],
      cardDefinitions: demoCards,
      powerDefinitions: demoPowers,
      classProgressions: demoProgressions,
    });

    expect(validateGameState(secondGame)).toEqual([]);
  });

});
