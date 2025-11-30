import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("explore_underwater.add");
    }

    onExit() {
        this.triggerEvent("explore_underwater.remove");
    }
}
