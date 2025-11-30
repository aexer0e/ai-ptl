import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "FightingMonsters", 1);
        this.entity.addTag("attack_monsters");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", true);
        this.setSelectedItem("bow");
        this.triggerEvent("ranged_attack.add");
    }

    onExit() {
        this.entity.removeTag("attack_monsters");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", false);
        this.setSelectedItem("air");
        this.triggerEvent("ranged_attack.remove");
    }
}
