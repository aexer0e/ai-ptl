import { ItemStack, Player } from "@minecraft/server";

/**
 * Represents the different game events and their associated data.
 */
export type GameEvents = {
    PlayerFullyJoined: [player: Player];
    PlayerGivenItem: [player: Player, item: ItemStack];
    PlayerTransformToSuper: [player: Player, powerLevel: number];
};
