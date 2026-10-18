import type {
    CardDefinitionId,
    CardId,
    Faction,
    PlayerId,
} from "./common";

import type { EffectGroup } from "./effect";

export type CardType = 
    | "action"
    | "item"
    | "champion";

export interface CardDefinition {
    id: CardDefinitionId;
    name: string;
    type: CardType;

    faction?: Faction;

    cost: number;

    defense?: number;
    isGuard?: boolean;

    primaryEffects: EffectGroup[];

    allyEffects?: EffectGroup[];

    sacrificeEffects?: EffectGroup[];

    image?: string;
}

export interface CardInstance {
    id: CardId;
    definitionId: CardDefinitionId;

    ownerId: PlayerId | null;

    exhausted: boolean;
}