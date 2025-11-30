import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("run_around.add");
        this.entity!.triggerEvent("gm1_sky:follow_players.remove");
        this.entity!.removeTag("follow_players");
        this.entity!.removeTag("should_follow_players");
    }

    onExit() {
        this.triggerEvent("run_around.remove");
    }
}
