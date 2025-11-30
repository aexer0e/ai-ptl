import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.triggerEvent("flee_players.add");
        //GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "FleeingMonsters", 0.1);
    }

    onExit() {
        this.triggerEvent("flee_players.remove");
    }
}
