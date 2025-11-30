import GameData from "Game/GameData";
import InventoryUtil from "Utilities/InventoryUtil";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.equipWeapon();

        this.entity!.triggerEvent("gm1_sky:attack_players.add");
        this.entity!.addTag("attack_players");
        this.entity!.addTag("should_attack_players");
    }

    onExit() {
        this.entity!.triggerEvent("gm1_sky:attack_players.remove");
        this.entity!.removeTag("attack_players");
        this.entity!.removeTag("should_attack_players");
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
