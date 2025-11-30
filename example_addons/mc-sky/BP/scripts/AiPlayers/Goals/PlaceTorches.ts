import EntityUtil from "Utilities/EntityUtil";
import Goal from "./Goal";

export default class extends Goal {
    tickEvery = 1;
    placingTorchTime = 1;

    onEnter() {
        this.setSelectedItem("torch");

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;
        });
    }

    onExit() {
        this.setSelectedItem("air");
        this.setProperty("gm1_sky:is_using_item", "idle");
    }

    onTick() {
        this.setProperty("gm1_sky:is_using_item", "swinging");

        if (this.placingTorchTime == 0) {
            if (this.entity.getProperty("gm1_sky:is_in_darkness")) {
                this.placingTorchTime = 1;
                this.setSelectedItem("torch");
            }
        }

        if (this.placingTorchTime > 0) {
            this.entity.setRotation({ x: 100, y: 0 });
            this.placingTorchTime++;

            if (this.placingTorchTime > 30) {
                this.setSelectedItem("air");
                const block = this.entity.dimension.getBlock(this.entity.location);
                if (this.entity.getProperty("gm1_sky:is_in_darkness")) {
                    block?.setType("torch");
                }
                //this.entity.dimension.setBlockType(this.entity.location, "torch");
                this.placingTorchTime = 0;
            }
        }
    }
}
