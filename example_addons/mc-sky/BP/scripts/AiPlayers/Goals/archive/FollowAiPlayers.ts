import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.entity!.triggerEvent("gm1_sky:follow_ai_players.add");
    }

    onExit() {
        this.entity!.triggerEvent("gm1_sky:follow_ai_players.remove");
    }
}
