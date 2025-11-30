import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Respawned", 0.5);
    }

    onExit() {}
}
