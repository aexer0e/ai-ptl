import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "FleeingMonsters", 1);
        this.triggerEvent("flee_monsters.add");
    }

    onExit() {
        this.triggerEvent("flee_monsters.remove");
    }
}
