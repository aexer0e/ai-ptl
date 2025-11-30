import { Entity, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { EntitySlot } from "Types/EntitySlot";

type ItemAndSlot = { itemStack: ItemStack; slot: number };

/*
    Provides utility functions for interacting with a entity's inventory
*/
export default class InventoryUtil {
    /*
        @param {entity} The entity to get the inventory of
        @returns The entity's inventory container
    */
    static getInventory(entity: Entity) {
        const inventoryComponent: EntityInventoryComponent = entity.getComponent("minecraft:inventory") as EntityInventoryComponent;
        return inventoryComponent.container;
    }

    /*
        @param {entity} The entity to get the equipment of
        @returns The entity's equipment inventory component
    */
    static getEquipment(entity: Entity) {
        const equipmentComponent: EntityEquippableComponent = entity.getComponent("equippable") as EntityEquippableComponent;
        return equipmentComponent;
    }

    /* 
        @param {entity} The entity to get the item from
        @param {itemStack} The item type to find
        @returns An array of items of the passed type found in the entity's inventory and equipment slots
    */
    static findItem(entity: Entity, itemStackToFind: ItemStack) {
        const itemsFound: { itemStack: ItemStack; entitySlot: EntitySlot }[] = [];

        // Check if entity has item in inventory
        const inventory = this.getInventory(entity);
        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                const itemStack = inventory.getItem(i);
                if (itemStack && itemStack.typeId === itemStackToFind.typeId) {
                    itemsFound.push({ itemStack, entitySlot: { isEquipment: false, slot: i } });
                }
            }
        }

        // Check if entity has item in equipment
        const equipment = this.getEquipment(entity);
        if (!equipment) return itemsFound;
        for (const slot in EquipmentSlot) {
            if (slot === EquipmentSlot.Mainhand) continue; // Skip mainhand because it's in the inventory

            const itemStack = equipment.getEquipment(slot as EquipmentSlot);
            if (itemStack && itemStack.typeId === itemStackToFind.typeId) {
                itemsFound.push({ itemStack, entitySlot: { isEquipment: true, slot: slot as EquipmentSlot } });
            }
        }

        return itemsFound;
    }

    /*
        @param {entity} The entity to get the item count from
        @param {itemStack} The item type to find
        @returns The number of items of the passed type found in the entity's inventory and equipment slots
    */
    static getItemCount(entity: Entity, itemStack: ItemStack) {
        const foundItems = this.findItem(entity, itemStack);
        let count = 0;
        for (const foundItem of foundItems) {
            count += foundItem.itemStack.amount;
        }
        return count;
    }

    /*
        @param {entity} The entity to check
        @param {itemStack} The item type to check
        @returns Whether the entity has the item in their inventory or equipment
    */
    static hasItem(entity: Entity, itemStack: ItemStack) {
        // Check if entity has item in inventory using findItem
        return this.getItemCount(entity, itemStack) > 0;
    }

    /*
        @param {entity} The entity to clear the inventory of
    */
    static clearInventory(entity: Entity) {
        // Doesn't use clearInventorySlot or clearEquipmentSlot because it's faster to loop through all slots

        // Clear inventory by looping through all slots
        const inventory = InventoryUtil.getInventory(entity);
        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                inventory.setItem(i, undefined);
            }
        }

        // Clear equipment
        const equipment = InventoryUtil.getEquipment(entity);
        if (!equipment) return;
        equipment.setEquipment(EquipmentSlot.Head, undefined);
        equipment.setEquipment(EquipmentSlot.Chest, undefined);
        equipment.setEquipment(EquipmentSlot.Legs, undefined);
        equipment.setEquipment(EquipmentSlot.Feet, undefined);
        equipment.setEquipment(EquipmentSlot.Offhand, undefined);
        equipment.setEquipment(EquipmentSlot.Mainhand, undefined);
    }

    /*
        @param {entity} The entity to clear the slots of
        @param {entitySlots} The slots to clear
    */
    static clearSlots(entity: Entity, entitySlots: EntitySlot[]) {
        for (const entitySlot of entitySlots) {
            this.clearSlot(entity, entitySlot);
        }
    }

    /*
        @param {entity} The entity to clear the inventory or equipment slot of
        @param {entitySlot} The slot to clear
    */
    static clearSlot(entity: Entity, entitySlot: EntitySlot) {
        if (entitySlot.isEquipment) this.clearEquipmentSlot(entity, entitySlot.slot as EquipmentSlot);
        else this.clearInventorySlot(entity, entitySlot.slot as number);
    }

    /* 
        @param {entity} The entity to clear the inventory slot of
        @param {slot} The slot to clear
    */
    static clearInventorySlot(entity: Entity, slot: number) {
        const inventory = this.getInventory(entity);
        if (!inventory) return;
        inventory.setItem(slot, undefined);
    }

    /*
        @param {entity} The entity to clear the equipment slot of
        @param {slot} The slot to clear
    */
    static clearEquipmentSlot(entity: Entity, slot: EquipmentSlot) {
        const equipment = this.getEquipment(entity);
        if (!equipment) return;
        equipment.setEquipment(slot, undefined);
    }

    static getAllInventoryItems(entity: Entity): ItemAndSlot[] {
        const items: ItemAndSlot[] = [];
        const inventory = this.getInventory(entity);
        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (item) items.push({ itemStack: item, slot: i });
            }
        }

        return items;
    }

    /*
        @param {entity} The entity to clear the item from
        @param {itemStack} The item stack to clear
    */
    static clearItem(entity: Entity, item: ItemStack) {
        const foundItems = this.findItem(entity, item);
        let amountToClear = item.amount;
        // Loop through and clear clearAmount of items
        for (const foundItem of foundItems) {
            const item = foundItem.itemStack;
            if (amountToClear <= 0) break;

            if (amountToClear >= item.amount) {
                this.clearSlot(entity, foundItem.entitySlot);
            } else {
                item.amount -= amountToClear;
                this.setItem(entity, item, foundItem.entitySlot);
            }

            amountToClear -= item.amount;
        }
    }

    static clearItemByNameTag(entity: Entity, itemTypeName: string) {
        const inventory = this.getInventory(entity);
        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (item && item.nameTag === itemTypeName) {
                    inventory.setItem(i, undefined);
                }
            }
        }
    }

    /*
        @param {entity} The entity to set the item in
        @param {itemStack} The item stack to set
        @param {entitySlot} The slot to set the item in
    */
    static setItem(entity: Entity, itemStack: ItemStack, entitySlot: EntitySlot) {
        if (entitySlot.isEquipment) this.setEquipmentItem(entity, entitySlot.slot as EquipmentSlot, itemStack);
        else this.setInventoryItem(entity, entitySlot.slot as number, itemStack);
    }

    /* 
        @param {entity} The entity to set the item in
        @param {itemStack} The item stack to set
        @param {slot} The slot to set the item in
    */
    static setInventoryItem(entity: Entity, slot: number, itemStack?: ItemStack) {
        const inventory = this.getInventory(entity);
        if (!inventory) return;
        inventory.setItem(slot, itemStack);
    }

    static setSelectedSlot(player: Player, itemStack?: ItemStack) {
        const inventory = this.getInventory(player);
        if (!inventory) return;
        inventory.setItem(player.selectedSlotIndex, itemStack);
    }

    /* 
        @param {entity} The entity to set the item in
        @param {itemStack} The item stack to set
        @param {slot} The slot to set the item in
    */
    static setEquipmentItem(entity: Entity, slot: EquipmentSlot, itemStack?: ItemStack) {
        const equipment = this.getEquipment(entity);
        if (!equipment) return console.warn(`Entity ${entity.typeId} does not have equipment`);
        equipment.setEquipment(slot, itemStack);
    }

    /* 
        @param {entity} The entity to give the item to
        @param {itemStack} The item stack to give
    */
    static giveItem(entity: Entity, itemStack: ItemStack) {
        const inventory = this.getInventory(entity);
        if (!inventory) return;
        inventory.addItem(itemStack);
    }

    /*
        @param {entity} The entity to give the items to
        @param {itemStacks} The item stacks to give
    */
    static giveItems(entity: Entity, itemStacks: ItemStack[]) {
        for (const itemStack of itemStacks) {
            this.giveItem(entity, itemStack);
        }
    }

    static selectedItem(player: Player): ItemStack | undefined {
        const inventory = this.getInventory(player);
        if (!inventory) return;
        const selectedItem = inventory.getItem(player.selectedSlotIndex);

        return selectedItem;
    }

    static emptySlotsCount(entity: Entity): number {
        const inventory = this.getInventory(entity);
        return inventory?.emptySlotsCount ?? 0;
    }
}
