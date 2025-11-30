import { EquipmentSlot } from "@minecraft/server";

export interface EntitySlot {
    slot: number | EquipmentSlot;
    isEquipment: boolean;
}
