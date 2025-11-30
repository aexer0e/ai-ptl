import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("stroll.add");
    }

    onExit() {
        this.triggerEvent("stroll.remove");
    }
}
