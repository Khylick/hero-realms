import { describe, expect, it } from "vitest";

import {
  createCard,
  createPlayer,
  resolveSimpleEffect,
} from "../core";

import { demoCards } from
  "../../game-content/cards/demo-cards";

describe("Card abilities model", () => {
  it("initialise les capacités utilisées à vide", () => {
    const card = createCard({
      id: "card-1",
      definitionId: "gold",
      ownerId: "player-1",
    });

    expect(card.exhausted).toBe(false);
    expect(card.usedAbilities).toEqual([]);
  });

  it("définit une capacité principale", () => {
    const gold = demoCards.gold;

    expect(gold.abilities).toContainEqual({
      id: "gold-primary",
      trigger: "onPlay",
      effects: [
        {
          type: "gainGold",
          amount: 1,
        },
      ],
    });
  });

  it("définit une capacité d'alliance", () => {
    const blade = demoCards.runicBlade;

    expect(
      blade.abilities.some(
        (ability) => ability.trigger === "ally",
      ),
    ).toBe(true);
  });

  it("définit un champion garde", () => {
    const guard = demoCards.royalGuard;

    expect(guard.type).toBe("champion");
    expect(guard.isGuard).toBe(true);
    expect(guard.defense).toBe(4);
  });

  it("résout toujours les effets simples", () => {
    const player = createPlayer({
      id: "player-1",
      name: "Héros",
      characterClass: "fighter",
    });

    const updated = resolveSimpleEffect(player, {
      type: "gainCombat",
      amount: 3,
    });

    expect(updated.resources.combat).toBe(3);
    expect(player.resources.combat).toBe(0);
  });
});