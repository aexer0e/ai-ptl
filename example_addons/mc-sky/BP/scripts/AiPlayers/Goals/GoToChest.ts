import { Block } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Goal from "./Goal";

export default class extends Goal {
    foundBlock: Block | undefined;
    complete = false;
    onEnter() {
        this.triggerEvent("go_to_chest.add");

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;
            if (eventData.eventId != "gm1_sky:chest_reached") return;

            this.foundBlock = this.findBlock({ min: new V3(-1, -1, -1), max: new V3(1, 2, 1) }, (block) => {
                return block.typeId == "minecraft:chest";
            });

            if (!this.foundBlock) {
                this.complete = true;
                return;
            }

            const blockLocation = new V3(this.foundBlock.location);

            this.entity.addEffect("slowness", 40, { amplifier: 100, showParticles: false });
            this.swingArm();
            this.entity!.dimension.playSound("random.chestopen", blockLocation);
            this.timeout(() => {
                this.entity!.dimension.playSound("chestclosed", blockLocation);
                this.complete = true;
            }, 40);
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
        this.triggerEvent("go_to_chest.remove");
    }
}
