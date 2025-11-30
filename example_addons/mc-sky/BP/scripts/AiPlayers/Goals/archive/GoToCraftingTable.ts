import { Block } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Goal from "../Goal";

export default class extends Goal {
    foundBlock: Block | undefined;
    complete = false;
    onEnter() {
        this.triggerEvent("go_to_crafting_table.add");

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;
            if (eventData.eventId != "gm1_sky:crafting_table_reached") return;

            this.foundBlock = this.findBlock({ min: new V3(-1, -1, -1), max: new V3(1, 2, 1) }, (block) => {
                return block.typeId == "minecraft:crafting_table";
            });

            if (!this.foundBlock) {
                this.complete = true;
                return;
            }

            this.entity.addEffect("slowness", 20, { amplifier: 100, showParticles: false });
            this.swingArm();
            this.timeout(() => {
                this.evaluateArmor();
            }, 20);
        });
    }

    tickEvery = 1;
    onTick() {
        if (this.foundBlock) {
            const rotation = V3.subtract(this.foundBlock.location, this.entity.getHeadLocation()).normalize().asRotation();
            this.entity.setRotation(rotation);
        }
    }

    onExit() {
        this.triggerEvent("go_to_crafting_table.remove");
    }
}
