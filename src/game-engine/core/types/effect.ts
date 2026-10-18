export type EffectTarget =
    | "self"
    | "ally"
    | "enemy"
    | "all-allies"
    | "all-enemies";

export type CardEffect =
    | {
        type: "gainGold";
        amount: number;
    }
    | {
        type: "gainCombat";
        amount: number;
    }
    | {
        type: "heal";
        amount: number;
        target: EffectTarget;
    }
    | {
        type: "drawCards";
        amount: number;
    }
    | {
        type: "discardCards";
        amount: number;
        target: EffectTarget;
    }
    | {
        type: "stunChampion";
        target: EffectTarget;
    }
    | {
        type: "sacrificeCard";
        target: EffectTarget;
    };

export interface EffectGroup {
    effects: CardEffect[];
    optional?: boolean;
}