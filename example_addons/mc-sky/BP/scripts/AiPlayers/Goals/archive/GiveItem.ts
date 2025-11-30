import { ItemStack } from "@minecraft/server";
import GameData from "Game/GameData";
import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import EntityStore from "Store/Entity/EntityStore";
import InventoryUtil from "Utilities/InventoryUtil";
import MathUtil from "Utilities/MathUtil";
import Goal from "../Goal";

export default class extends Goal {
    complete = false;

    onEnter() {
        this.interval(() => {
            this.lookAtNearestPlayer();
        }, 1);

        const allItems = InventoryUtil.getAllInventoryItems(this.entity!);
        if (allItems.length === 0) {
            this.complete = true;
            return;
        }

        const choosenInventorySlot = MathUtil.choose(allItems);
        const itemToGiveAway = new ItemStack(choosenInventorySlot.itemStack.typeId, choosenInventorySlot.itemStack.amount);

        this.setSelectedItem(choosenInventorySlot.itemStack.typeId);

        this.timeout(() => {
            GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "GiftItem", 0.3, [
                choosenInventorySlot.itemStack.nameTag!,
            ]),
                this.throwItem(itemToGiveAway);
            InventoryUtil.clearInventorySlot(this.entity!, choosenInventorySlot.slot);
            AiPlayer.addSocialBattery(this.entity!, -25);
            this.setSelectedItem("air");
            this.complete = true;
        }, 40);
    }

    tickEvery = 1;

    onTick(): void {}

    onExit() {}
}
