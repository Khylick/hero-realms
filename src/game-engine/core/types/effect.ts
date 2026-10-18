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
    }
    | {
        type: "chooseCard";
        from: "hand" | "discard";
        action: "discard" | "sacrifice";
        amount: number;
    };

export interface EffectGroup {
    effects: CardEffect[];
    optional?: boolean;
}