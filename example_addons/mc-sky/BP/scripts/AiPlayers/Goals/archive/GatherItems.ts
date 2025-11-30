import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("gather_items.add");
        this.entity.addTag("target_nearest_item");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", true);
    }

    onExit() {
        this.triggerEvent("gather_items.remove");
        this.entity.addTag("target_nearest_item");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", false);
    }
}
