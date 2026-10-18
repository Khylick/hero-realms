import type { PlayerState } from "../types/player";

type ResourceType = "gold" | "combat";

export function gainResource(
    player: PlayerState,
    resource: ResourceType,
    amount: number,
): PlayerState {
    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new Error("Quantité de ressource invalide.");
    }

    return {
        ...player,
        resources: {
            ...player.resources,
            [resource]: player.resources[resource] + amount,
        },
    };
}

export function spendResource(
    player: PlayerState,
    resource: ResourceType,
    amount: number,
): PlayerState {
    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new Error("Quantité de ressource invalide.");
    }

    if (player.resources[resource] < amount) {
        throw new Error(
             `Ressource insuffisante : ${resource}.`,
        );
    }

    return {
        ...player,
        resources: {
            ...player.resources,
            [resource]: player.resources[resource] - amount,
        },
    };
}

export function healPlayer(
    player: PlayerState,
    amount: number,
): PlayerState {
    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new Error("Quantité de soin invalide.");
    }

    return {
        ...player,
        health: Math.min(
            player.maxHealth,
            player.health + amount,
        ),
    };
}

export function damagePlayer(
    player: PlayerState,
    amount: number,
): PlayerState {
    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw new Error("Quantité de dégats invalide.");
    }

    const health = Math.max(0, player.health - amount);

    return {
        ...player,
        health,
        defeated: health === 0,
    };
}

export function resetResources(
    player: PlayerState
): PlayerState {
    return {
        ...player,
        resources: {
            gold: 0,
            combat: 0,
        },
    };
}