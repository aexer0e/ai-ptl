import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("seek_safety.add");
    }

    onExit() {
        this.triggerEvent("seek_safety.remove");
    }
}
