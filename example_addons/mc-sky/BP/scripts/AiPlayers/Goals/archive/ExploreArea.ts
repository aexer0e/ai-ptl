import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("explore_area.add");
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "FollowMe", 0.025);
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Adventure", 0.025);
    }

    onExit() {
        this.triggerEvent("explore_area.remove");
    }
}
