import { world } from "@minecraft/server";

export default class RingPlacerBlock {
    static init() {
        world.beforeEvents.worldInitialize.subscribe((initEvent) => {
            initEvent.blockComponentRegistry.registerCustomComponent("gm1_ord:ring_placer", {
                onTick: (event) => {
                    const ringLoc = event.block.location;
                    ringLoc.x += 0.5;
                    //ringLoc.y -= 0.5;
                    ringLoc.z += 0.5;
                    event.dimension.spawnEntity("gm1_ord:ring", ringLoc);
                    event.dimension.setBlockType(event.block.location, "minecraft:air");
                },
            });
        });
    }
}
