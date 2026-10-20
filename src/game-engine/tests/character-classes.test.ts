
import { describe, expect, it } from "vitest";

import {
  createClassPlayer,
  PLAYER_CLASSES,
  validateClassDefinition,
  validateClassRegistry,
  type ClassDefinition,
} from "../core";

import { demoClasses } from "../../game-content/classes/demo-classes";

describe("Character classes", () => {
  it("définit les cinq classes jouables", () => {
    expect(Object.keys(demoClasses).sort()).toEqual(
      [...PLAYER_CLASSES].sort(),
    );
  });

  it("valide le registre de démonstration", () => {
    expect(
      validateClassRegistry(demoClasses),
    ).toEqual([]);
  });

  it("associe un identifiant cohérent à chaque classe", () => {
    for (const classId of PLAYER_CLASSES) {
      expect(demoClasses[classId].id).toBe(classId);
    }
  });


  it("crée un guerrier avec les caractéristiques de sa classe", () => {
    const player = createClassPlayer({
      id: "hero-1",
      name: "Arthas",
      classDefinition: demoClasses.fighter,
    });

    expect(player.id).toBe("hero-1");
    expect(player.name).toBe("Arthas");

    expect(player.characterClass).toBe("fighter");

    expect(player.health).toBe(50);
    expect(player.maxHealth).toBe(50);

    expect(player.level).toBe(1);
    expect(player.experience).toBe(0);

    expect(player.defeated).toBe(false);
  });

  it("applique les caractéristiques personnalisées", () => {
    const customClass: ClassDefinition = {
      ...demoClasses.wizard,
      startingStats: {
        maxHealth: 37,
        startingLevel: 3,
        startingExperience: 12,
      },
    };

    const player = createClassPlayer({
      id: "hero-2",
      name: "Merlin",
      classDefinition: customClass,
    });

    expect(player.characterClass).toBe("wizard");
    expect(player.health).toBe(37);
    expect(player.maxHealth).toBe(37);
    expect(player.level).toBe(3);
    expect(player.experience).toBe(12);
  });

  it("initialise les zones et ressources du héros", () => {
    const player = createClassPlayer({
      id: "hero-3",
      name: "Sylvan",
      classDefinition: demoClasses.ranger,
    });

    expect(player.resources).toEqual({
      gold: 0,
      combat: 0,
    });

    expect(player.zones).toEqual({
      deck: [],
      hand: [],
      discard: [],
      inPlay: [],
      champions: [],
      sacrificed: [],
    });
  });

  
  it("refuse une classe avec des PV invalides", () => {
    const invalidClass: ClassDefinition = {
      ...demoClasses.cleric,
      startingStats: {
        ...demoClasses.cleric.startingStats,
        maxHealth: -5,
      },
    };

    expect(
      validateClassDefinition(invalidClass),
    ).toContain(
      "Les points de vie initiaux doivent être positifs.",
    );

    expect(() =>
      createClassPlayer({
        id: "hero-invalid",
        name: "Héros",
        classDefinition: invalidClass,
      }),
    ).toThrow("Définition de classe invalide");
  });

  it("refuse un niveau initial invalide", () => {
    const invalidClass: ClassDefinition = {
      ...demoClasses.thief,
      startingStats: {
        ...demoClasses.thief.startingStats,
        startingLevel: 0,
      },
    };

    expect(
      validateClassDefinition(invalidClass),
    ).toContain(
      "Le niveau initial doit être supérieur ou égal à 1.",
    );
  });

  it("refuse une expérience initiale négative", () => {
    const invalidClass: ClassDefinition = {
      ...demoClasses.wizard,
      startingStats: {
        ...demoClasses.wizard.startingStats,
        startingExperience: -10,
      },
    };

    expect(
      validateClassDefinition(invalidClass),
    ).toContain(
      "L'expérience initiale ne peut pas être négative.",
    );
  });


  it("ne modifie pas la définition de classe", () => {
    const snapshot = structuredClone(demoClasses.fighter);

    createClassPlayer({
      id: "hero-4",
      name: "Guerrier",
      classDefinition: demoClasses.fighter,
    });

    expect(demoClasses.fighter).toEqual(snapshot);
  });

  it("crée des états indépendants pour deux héros", () => {
    const first = createClassPlayer({
      id: "hero-1",
      name: "Premier",
      classDefinition: demoClasses.cleric,
    });

    const second = createClassPlayer({
      id: "hero-2",
      name: "Second",
      classDefinition: demoClasses.cleric,
    });

    first.health = 10;
    first.zones.hand.push("test-card");

    expect(second.health).toBe(50);
    expect(second.zones.hand).toEqual([]);
  });


});
