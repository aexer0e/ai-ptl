import { Block, system } from "@minecraft/server";
import V3 from "Wrappers/V3";
import Trigger from "./Trigger";

export default class PlayerAttack extends Trigger {
    init() {
        this.onWorldEvent("WorldBeforeEvents", "explosion", (eventData) => {
            const sourceTypeId = eventData.source?.typeId;
            if (!sourceTypeId) return;

            if (sourceTypeId == "gm1_zen:ignite_gas" || (sourceTypeId.startsWith("gm1_zen:") && sourceTypeId.endsWith("_projectile"))) {
                const impactedBlocks = eventData.getImpactedBlocks();
                eventData.cancel = true;

                system.run(() => this.destroyBlocks(impactedBlocks));
            }
        });
    }

    destroyBlocks(impactedBlocks: Block[]) {
        for (const block of impactedBlocks) {
            if (!block.isValid) continue;

            const location = new V3(block.location);
            const destroyCmd = `setblock ${location.toString()} air destroy`;
            block.dimension.runCommand(destroyCmd);
        }
    }
}
