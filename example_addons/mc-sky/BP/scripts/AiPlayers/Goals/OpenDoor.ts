import { Block } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Goal from "./Goal";

export default class extends Goal {
    foundBlock: Block | undefined;
    complete = false;

    onEnter() {
        this.triggerEvent("go_to_door.add");

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;
            if (eventData.eventId != "gm1_sky:door_reached") return;

            this.foundBlock = this.findBlock({ min: new V3(-1, -1, -1), max: new V3(1, 2, 1) }, (block) => {
                return block.typeId == "minecraft:door";
            });

            if (!this.foundBlock) {
                this.complete = true;
                return;
            }

            this.triggerEvent("open_door");
        });
    }

    onExit() {
        this.triggerEvent("go_to_door.remove");
    }
}
