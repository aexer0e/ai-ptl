import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import InventoryUtil from "Utilities/InventoryUtil";
import MathUtil from "Utilities/MathUtil";
import Goal from "../Goal";

export default class extends Goal {
    complete = false;

    onEnter() {
        const allItems = InventoryUtil.getAllInventoryItems(this.entity!);
        if (allItems.length === 0) {
            this.complete = true;
            return;
        }
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Random", 0.05);

        const choosenInventorySlot = MathUtil.choose(allItems);

        this.setSelectedItem(choosenInventorySlot.itemStack.typeId);

        this.timeout(() => {
            this.complete = true;
        }, 10);
    }

    tickEvery = 1;

    onTick(): void {}

    onExit() {}
}
