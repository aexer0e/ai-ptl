import EntityStore from "Store/Entity/EntityStore";
import V3 from "Wrappers/V3";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.entity!.triggerEvent("gm1_sky:pickup_items.add");
        this.entity!.addTag("pickup_items");
        EntityStore.temporary.set(this.entity!, "targetItem", this.nearestUsefulItemEntity);
    }

    onExit() {
        this.entity!.triggerEvent("gm1_sky:pickup_items.remove");
        this.entity!.removeTag("pickup_items");
        EntityStore.temporary.set(this.entity!, "targetItem", undefined);
    }

    tickEvery = 5;
    onTick() {
        EntityStore.temporary.set(this.entity!, "targetItem", this.nearestUsefulItemEntity);
        if (this.nearestUsefulItemEntity && V3.distance(this.entity!.location, this.nearestUsefulItemEntity.location) < 1.3) {
            this.nearestUsefulItemEntity.teleport(this.entity.location);
        }
    }
}
