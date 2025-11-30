import GameData from "Game/GameData";
import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    tickEvery = 15;

    onEnter() {
        this.triggerEvent("look_at_player.add");
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Hello", 0.2);
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Random", 0.1);
    }

    onExit() {
        AiPlayer.addSocialBattery(this.entity!, -10);
        this.setProperty("gm1_sky:is_sneaking", false);
        this.triggerEvent("look_at_player.remove");
        this.entity?.removeTag("punched_player");
    }

    onTick() {
        this.setProperty("gm1_sky:is_sneaking", !this.getProperty("gm1_sky:is_sneaking"));
    }
}
