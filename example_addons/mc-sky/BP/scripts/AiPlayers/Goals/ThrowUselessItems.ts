import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import GameData from "Game/GameData";
import InventoryUtil from "Utilities/InventoryUtil";
import MathUtil from "Utilities/MathUtil";
import Goal from "./Goal";

export default class extends Goal {
    complete = false;

    onEnter(): void {
        this.interval(() => {
            this.lookAtNearestPlayer();
        }, 1);
    }

    tickEvery = 20;
    onTick() {
        const allItems = InventoryUtil.getAllInventoryItems(this.entity!);

        const allItemWhiteList = [...GameData.AiPlayerItemWhitelist, ...AiPlayerWrapper.getHigherArmorList(this.entity)];
        const uselessItems = allItems.filter((item) => !allItemWhiteList.includes(item.itemStack.typeId));

        if (uselessItems.length === 0) {
            this.complete = true;
            return;
        }

        const choosenInventorySlot = MathUtil.choose(uselessItems);
        const itemToGiveAway = choosenInventorySlot.itemStack.clone();

        this.setSelectedItem(choosenInventorySlot.itemStack.typeId);

        this.throwItem(itemToGiveAway);
        InventoryUtil.clearInventorySlot(this.entity!, choosenInventorySlot.slot);
        this.setSelectedItem("air");
    }
}
