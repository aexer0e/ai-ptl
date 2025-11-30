import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.setSelectedItem("minecraft:egg");
        this.entity.addTag("target_nearest_mob");
        this.triggerEvent("pelt_eggs.add");
    }

    onExit() {
        this.setSelectedItem("minecraft:air");
        this.entity.removeTag("target_nearest_mob");
        this.triggerEvent("pelt_eggs.remove");
    }
}
