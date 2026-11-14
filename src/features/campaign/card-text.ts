import type { CardEffect } from "../../game-engine/core";

export function describeEffect(effect: CardEffect): string {
  switch (effect.type) {
    case "gainGold":
      return `+${effect.amount} or`;
    case "gainCombat":
      return `+${effect.amount} combat`;
    case "heal":
      return `+${effect.amount} santé`;
    case "drawCards":
      return `Piocher ${effect.amount}`;
    case "discardCards":
      return `Défausser ${effect.amount}`;
    case "stunChampion":
      return "Assommer un champion";
    case "sacrificeCard":
      return "Sacrifier une carte de la main";
    case "chooseCard":
      return `${effect.action === "sacrifice" ? "Sacrifier" : "Défausser"} ${effect.amount} de ${effect.from === "hand" ? "la main" : "la défausse"}`;
  }
}

export const factionNames = {
  imperial: "Empire",
  guild: "Guilde",
  necros: "Nécros",
  wild: "Nature",
};
export const classNames = {
  cleric: "Clerc",
  fighter: "Guerrier",
  ranger: "Rôdeur",
  thief: "Voleur",
  wizard: "Magicien",
};
