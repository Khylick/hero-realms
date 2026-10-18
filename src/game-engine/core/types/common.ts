export type CardId = string;
export type CardDefinitionId = string;
export type PlayerId = string;
export type EnemyId = string;
export type CampaignId = string;
export type EncounterId = string;

export type Faction = 
    | "imperial"
    | "guild"
    | "necros"
    | "wild";

export type GameMode = "solo" | "local" | "online";

export type GameStatus = 
    | "setup"
    | "playing"
    | "victory"
    | "defeat";

export type GamePhase =
    | "master"
    | "main"
    | "discard"
    | "draw"
    | "ended";

export type PlayerClass = 
    | "cleric"
    | "fighter"
    | "ranger"
    | "thief"
    | "wizard";