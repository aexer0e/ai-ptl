import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.entity!.triggerEvent("gm1_sky:follow_players.remove");
        this.entity!.removeTag("follow_players");
        this.entity!.removeTag("should_follow_players");
        this.triggerEvent("look_at_player.add");
        this.triggerEvent("explore_area.add");
        if (Math.random() < 0.4) {
            this.setProperty("gm1_sky:is_sneaking", true);
        }
    }

    onExit() {
        AiPlayer.addSocialBattery(this.entity!, -10);
        this.triggerEvent("look_at_player.remove");
        this.triggerEvent("explore_area.remove");
        this.setProperty("gm1_sky:is_sneaking", false);
    }
}
