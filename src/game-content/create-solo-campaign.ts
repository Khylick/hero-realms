import {
  applyAction,
  createHeroGame,
  createHeroProfile,
  createMarket,
  createFireGemSupply,
  initializeEncounter,
  type GameState,
  type PlayerClass,
} from "../game-engine/core";
import { demoHeroGameContent } from "./demo-hero-game-content";
import { soloCampaignContent } from "./campaigns/demo/solo-campaign-content";

export const soloEncounterId = "shadow-altar";

export function createSoloCampaign(
  characterClass: PlayerClass,
  name: string,
  seed: number,
): GameState {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error("La graine doit être un entier entre 0 et 4294967295.");
  const profile = createHeroProfile({
    id: "hero",
    name: name.trim() || "Aventurier",
    characterClass,
  });
  let game = createHeroGame({
    id: `solo-${seed}`,
    mode: "solo",
    profiles: [profile],
    content: demoHeroGameContent,
    seed,
  });
  const market = [
    "runicBlade",
    "royalGuard",
    "tacticalScroll",
    "imperialScout",
    "imperialStrategist",
    "arcaneGuardian",
    "battleMage",
    "woodlandRemedy",
    "soulOffering",
  ];
  game = createMarket(game, [...market, ...market, ...market, ...market]);
  game = createFireGemSupply(game, "fireGem");
  game = initializeEncounter(game, {
    encounterId: soloEncounterId,
    content: soloCampaignContent,
  });
  return applyAction(game, { type: "START_GAME" });
}
