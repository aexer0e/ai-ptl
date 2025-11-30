import { Block, Player, PlayerInteractWithBlockBeforeEvent, system } from "@minecraft/server";
import EventEmitter from "./EventEmitter";

export default class BlockUtil {
    private static lastInteraction = new Map<string, number>();
    static readonly events = new EventEmitter<{
        blockInteraction: [player: Player, block: Block];
    }>();

    static init() {
        //This is not stable
        /*world.beforeEvents.playerInteractWithBlock.subscribe((eventData) => {
            BlockUtil.onBlockInteraction(eventData);
        });*/
    }

    private static onBlockInteraction(eventData: PlayerInteractWithBlockBeforeEvent) {
        const currentTick = system.currentTick;
        const lastInteractionTick = BlockUtil.lastInteraction.get(eventData.player.id) || 0;
        BlockUtil.lastInteraction.set(eventData.player.id, currentTick);

        if (lastInteractionTick + 4 >= currentTick) return;

        system.run(() => BlockUtil.events.emit("blockInteraction", eventData.player, eventData.block));
    }
}
