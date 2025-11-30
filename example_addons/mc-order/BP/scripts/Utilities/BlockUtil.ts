import { NumberRange } from "@minecraft/common";
import { Block, Dimension, system, Vector3, world } from "@minecraft/server";
import DebugTimer from "./DebugTimer";

export default class BlockUtil {
    private static previousGetBlockTick: number = -1;
    private static gottenBlocks = new Map<string, Block | undefined>();
    private static heightRanges = new Map<string, NumberRange>();

    static init() {
        //This is not stable
        /*EventUtil.subscribe("WorldBeforeEvents", "playerInteractWithBlock", (eventData) => {
            BlockUtil.onBlockInteraction(eventData);
        });*/
        const overworld = world.getDimension("overworld");
        const nether = world.getDimension("nether");
        const the_end = world.getDimension("the_end");
        this.heightRanges.set(overworld.id, overworld.heightRange);
        this.heightRanges.set(nether.id, nether.heightRange);
        this.heightRanges.set(the_end.id, the_end.heightRange);
    }

    static InHeightBounds(location: Vector3, dimensionId: string): boolean {
        // We take a dimensionId string instead of a Dimension itself so the value can be cached outside of this function
        const heightRange = this.heightRanges.get(dimensionId);
        return location.y < heightRange!.max && location.y > heightRange!.min;
    }

    static GetBlock(dimension: Dimension, location: Vector3): Block | undefined {
        DebugTimer.countStart("BlockUtilGetBlock");
        // Clear gottenBlocks if the existing list was from a previous tick
        const currentTick = system.currentTick;
        if (this.previousGetBlockTick !== currentTick) {
            this.gottenBlocks.clear();
            this.previousGetBlockTick = currentTick;
        }
        // Return pre-gotten block if it exists, otherwise save and return a new one
        const dimensionId = dimension.id;
        const hash = `${dimensionId}X${location.x}Y${location.y}Z${location.z}`;
        if (this.gottenBlocks.has(hash)) {
            DebugTimer.countEnd();
            return this.gottenBlocks.get(hash);
        } else if (this.InHeightBounds(location, dimensionId)) {
            const block = dimension.getBlock(location);
            this.gottenBlocks.set(hash, block);
            DebugTimer.countEnd();
            return block;
        } else {
            return undefined;
        }
    }
}
