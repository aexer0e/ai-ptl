import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        if (AiPlayerWrapper.timeSinceFirstLogin(this.entity) < 20 * 20) {
            GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Greeting", 0.5, [
                EntityStore.get(this.entity, "name"),
            ]);
        }
    }

    onExit() {}

    onTick() {}
}
