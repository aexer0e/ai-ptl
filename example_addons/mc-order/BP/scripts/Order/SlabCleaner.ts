import { system, world } from "@minecraft/server";
import ReplacedBlock from "./ReplacedBlock";

export default class SlabCleaner {
    static slabData: ReplacedBlock[] | null = null;

    static init() {
        const savedData = world.getDynamicProperty("gm1_ord:leftover_invisible_slabs");
        if (typeof savedData === "string") {
            SlabCleaner.slabData = JSON.parse(savedData);
            system.run(() => {
                SlabCleaner.CleanSlabs();
            });
        }
    }

    static CleanSlabs() {
        if (this.slabData) {
            let needsRerun = false;
            for (let i = this.slabData.length - 1; i >= 0; i--) {
                if (!this.slabData) {
                    break;
                } // This line is not logically necessary, but the linter requires it
                const block = this.slabData[i];
                try {
                    world.getDimension(block.dimension).setBlockType(block.location, block.typeId);
                    this.slabData.splice(i, 1);
                    if (this.slabData.length == 0) {
                        this.slabData = null;
                        break;
                    }
                } catch (error) {
                    needsRerun = true;
                }
            }
            if (needsRerun) {
                world.setDynamicProperty("gm1_ord:leftover_invisible_slabs", JSON.stringify(SlabCleaner.slabData));
                system.runInterval(() => {
                    SlabCleaner.CleanSlabs();
                }, 20 * 5);
            } else {
                world.setDynamicProperty("gm1_ord:leftover_invisible_slabs", false);
            }
        }
    }
}
