import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("float.add");
    }

    onExit() {
        this.triggerEvent("float.remove");
    }
}
