import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.entity!.triggerEvent("gm1_sky:follow_players.add");
        this.entity!.addTag("follow_players");
        this.entity!.addTag("should_follow_players");
    }

    onExit() {
        AiPlayer.addSocialBattery(this.entity!, -25);
        this.entity!.triggerEvent("gm1_sky:follow_players.remove");
        this.entity!.removeTag("follow_players");
        this.entity!.removeTag("should_follow_players");
    }
}
