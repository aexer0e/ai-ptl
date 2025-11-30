import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("farm.add");
        this.equipHoe();
    }

    onExit() {
        this.triggerEvent("farm.remove");
        this.setSelectedItem("air");
    }

    equipHoe() {
        if (EntityStore.get(this.entity, "ironObtained") > 5) {
            this.setSelectedItem("iron_hoe");
            return;
        } else if (EntityStore.get(this.entity, "woodObtained") > 2) {
            this.setSelectedItem("wooden_hoe");
            return;
        }
        this.setSelectedItem("air");
    }
}
