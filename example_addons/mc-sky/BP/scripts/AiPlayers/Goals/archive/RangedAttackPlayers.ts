import EntityStore from "Store/Entity/EntityStore";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.entity?.addTag("attack_players");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", true);
        this.setSelectedItem("bow");
        this.triggerEvent("ranged_attack.add");
        //GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "FightingMonsters", 0.1);
    }

    onExit() {
        this.entity.removeTag("attack_players");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", false);
        this.setSelectedItem("air");
        this.triggerEvent("ranged_attack.remove");
    }
}
