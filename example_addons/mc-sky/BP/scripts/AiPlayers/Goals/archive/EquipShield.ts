import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.setOffhandItem("shield");
    }

    onExit() {}
}
