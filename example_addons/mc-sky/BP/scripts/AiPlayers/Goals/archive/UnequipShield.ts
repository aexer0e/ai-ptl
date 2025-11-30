import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.setOffhandItem("air");
    }

    onExit() {}
}
