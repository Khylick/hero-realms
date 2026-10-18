import type {
  CardId,
  PlayerClass,
  PlayerId,
} from "./common";

export interface PlayerResources {
    gold: number;
    combat: number;
}

export interface PlayerZones {
    deck: CardId[];
    hand: CardId[];
    discard: CardId[];
    inPlay: CardId[];
    champions: CardId[];
    sacrificed: CardId[];
}

export interface PlayerState {
    id: PlayerId;
    name: string;

    characterClass: PlayerClass;

    health: number;
    maxHealth: number;

    resources: PlayerResources;
    zones: PlayerZones;

    experience: number;
    level: number;

    defeated: boolean;
}