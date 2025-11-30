import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import InventoryUtil from "Utilities/InventoryUtil";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.entity.addTag("attack_animals");
        this.equipWeapon();
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", true);
        this.triggerEvent("attack_animals.add");
    }

    onExit() {
        this.entity.removeTag("attack_animals");
        EntityStore.temporary.set(this.entity, "isUsingAttackComponent", false);
        this.setSelectedItem("air");
        this.triggerEvent("attack_animals.remove");
    }

    equipWeapon() {
        const inventory = InventoryUtil.getAllInventoryItems(this.entity);
        const allWeapons = GameData.ItemGroup["minecraft:weapon"];
        const weaponsFound = inventory.filter((item) => allWeapons.includes(item.itemStack.typeId));
        const bestWeapon = allWeapons.find((weapon) => weaponsFound.some((item) => item.itemStack.typeId === weapon));

        if (!bestWeapon) return this.setSelectedItem("air");

        this.setSelectedItem(bestWeapon);
    }
}
