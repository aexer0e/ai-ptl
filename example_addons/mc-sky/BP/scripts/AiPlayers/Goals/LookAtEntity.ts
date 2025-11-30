import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("look_at_entity.add");
    }

    onExit() {
        this.triggerEvent("look_at_entity.remove");
    }
}
