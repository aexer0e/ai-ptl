import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.setSelectedItem("minecraft:snowball");
        this.entity.addTag("target_nearest_mob");
        this.triggerEvent("pelt_snowballs.add");
    }

    onExit() {
        this.setSelectedItem("minecraft:air");
        this.entity.removeTag("target_nearest_mob");
        this.triggerEvent("pelt_snowballs.remove");
    }
}
