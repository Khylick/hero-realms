
import { describe, expect, it } from "vitest";

import {
  createPlayer,
  gainResource,
  spendResource,
  healPlayer,
  damagePlayer,
  resetResources,
} from "../core";

function makePlayer() {
  return createPlayer({
    id: "player-1",
    name: "Héros",
    characterClass: "fighter",
  });
}

describe("Player resources", () => {
  it("ajoute de l'or sans modifier le joueur initial", () => {
    const player = makePlayer();

    const updated = gainResource(
      player,
      "gold",
      5,
    );

    expect(updated.resources.gold).toBe(5);
    expect(player.resources.gold).toBe(0);
  });

  it("dépense de l'or", () => {
    const player = gainResource(
      makePlayer(),
      "gold",
      5,
    );

    const updated = spendResource(
      player,
      "gold",
      3,
    );

    expect(updated.resources.gold).toBe(2);
  });

  it("refuse une dépense supérieure aux ressources", () => {
    expect(() =>
      spendResource(makePlayer(), "gold", 3),
    ).toThrow("Ressource insuffisante");
  });

  it("limite les soins à la santé maximale", () => {
    const player = damagePlayer(makePlayer(), 10);

    const healed = healPlayer(player, 20);

    expect(healed.health).toBe(50);
  });

  it("détecte la défaite d'un personnage", () => {
    const updated = damagePlayer(makePlayer(), 100);

    expect(updated.health).toBe(0);
    expect(updated.defeated).toBe(true);
  });

  it("réinitialise les ressources", () => {
    let player = makePlayer();

    player = gainResource(player, "gold", 5);
    player = gainResource(player, "combat", 3);
    player = resetResources(player);

    expect(player.resources).toEqual({
      gold: 0,
      combat: 0,
    });
  });
});
