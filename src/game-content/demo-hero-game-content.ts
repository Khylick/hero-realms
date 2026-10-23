import type {
  HeroGameContent,
} from "../game-engine/core/types/hero-game-content";

import {
  demoCards,
} from "./cards/demo-cards";

import {
  demoClasses,
} from "./classes/demo-classes";

import {
  demoPowers,
} from "./classes/demo-powers";

import {
  demoProgressions,
} from "./classes/demo-progressions";

export const demoHeroGameContent: HeroGameContent = {
  cardDefinitions: demoCards,
  classDefinitions: demoClasses,
  powerDefinitions: demoPowers,
  classProgressions: demoProgressions,
};
