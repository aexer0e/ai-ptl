import { ItemStack } from "@minecraft/server";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import { ArmorSlot, ArmorTier } from "../../Types/ArmorSlot";
import InventoryUtil from "../../Utilities/InventoryUtil";
import Goal from "./Goal";

export default class extends Goal {
    onEnter() {
        this.equipBestArmor();
    }

    tickEvery = 1;
    onTick() {
        this.equipBestArmor();
    }

    onExit() {}

    equipBestArmor() {
        const { oldArmorSlot, newArmorSlot } = AiPlayerWrapper.getOldAndNewArmorSlot(this.entity);

        for (const slot of [ArmorSlot.Head, ArmorSlot.Body, ArmorSlot.Legs, ArmorSlot.Feet]) {
            const oldTier = oldArmorSlot[slot];
            const newTier = newArmorSlot[slot];

            this.setArmorTier(slot, newTier);

            if (oldTier !== ArmorTier.None) {
                InventoryUtil.giveItem(this.entity, new ItemStack(`minecraft:${oldTier}_${slot}`, 1));
            }
            if (newTier !== ArmorTier.None) {
                InventoryUtil.clearItem(this.entity, new ItemStack(`minecraft:${newTier}_${slot}`, 1));
            }
        }
    }
}
