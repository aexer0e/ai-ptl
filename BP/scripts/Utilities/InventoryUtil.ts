import {
    Entity,
    EntityEquippableComponent,
    EntityInventoryComponent,
    EquipmentSlot,
    ItemLockMode,
    ItemStack,
    Player,
} from "@minecraft/server";

type EntitySlot = { isEquipment: boolean; slot: number | EquipmentSlot };

class _InventoryUtil {
    /*
        @param {entity} The entity to get the inventory of
        @returns The entity's inventory container
    */
    static getInventory(entity: Entity) {
        DebugTimer.countStart("InventoryUtil.getInventory");
        const inventoryComponent: EntityInventoryComponent = entity.getComponent("minecraft:inventory") as EntityInventoryComponent;
        DebugTimer.countEnd();
        return inventoryComponent.container;
    }

    /*
        @param {entity} The entity to get the equipment of
        @returns The entity's equipment inventory component
    */
    static getEquipment(entity: Entity) {
        DebugTimer.countStart("InventoryUtil.getEquipment");
        const equipmentComponent: EntityEquippableComponent = entity.getComponent("equippable") as EntityEquippableComponent;
        DebugTimer.countEnd();
        return equipmentComponent;
    }

    /* 
        @param {entity} The entity to get the item from
        @param {itemStack} The item type to find
        @returns An array of items of the passed type found in the entity's inventory and equipment slots
    */
    static findItem(entity: Entity, itemStackToFind: ItemStack, checkEquipment = true) {
        DebugTimer.countStart("InventoryUtil.findItem");
        const returnAndEndCount = (result: { itemStack: ItemStack; entitySlot: EntitySlot }[]) => {
            DebugTimer.countEnd();
            return result;
        };

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
        if (!checkEquipment) return returnAndEndCount(itemsFound);

        const equipment = this.getEquipment(entity);
        if (!equipment) return returnAndEndCount(itemsFound);
        for (const slot in EquipmentSlot) {
            if (slot === EquipmentSlot.Mainhand) continue; // Skip mainhand because it's in the inventory

            const itemStack = equipment.getEquipment(slot as EquipmentSlot);
            if (itemStack && itemStack.typeId === itemStackToFind.typeId) {
                itemsFound.push({ itemStack, entitySlot: { isEquipment: true, slot: slot as EquipmentSlot } });
            }
        }

        return returnAndEndCount(itemsFound);
    }

    static findFirstItem(entity: Entity, itemTypesToFind: string[]) {
        DebugTimer.countStart("InventoryUtil.findFirstItem");
        const returnAndEndCount = (result: { itemStack: ItemStack; entitySlot: EntitySlot } | null) => {
            DebugTimer.countEnd();
            return result;
        };

        const inventory = this.getInventory(entity);
        if (!inventory) return returnAndEndCount(null);

        const offHand = this.getEquipment(entity)?.getEquipment(EquipmentSlot.Offhand);
        if (offHand && itemTypesToFind.some((typeId) => typeId === offHand.typeId)) {
            return returnAndEndCount({ itemStack: offHand, entitySlot: { isEquipment: true, slot: EquipmentSlot.Offhand } });
        }

        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item && itemTypesToFind.some((typeId) => typeId === item.typeId)) {
                return returnAndEndCount({ itemStack: item, entitySlot: { isEquipment: false, slot: i } });
            }
        }

        return returnAndEndCount(null);
    }

    /*
        @param {entity} The entity to get the item count from
        @param {itemStack} The item type to find
        @returns The number of items of the passed type found in the entity's inventory and equipment slots
    */
    static getItemCount(entity: Entity, itemStack: ItemStack) {
        DebugTimer.countStart("InventoryUtil.getItemCount");
        const foundItems = this.findItem(entity, itemStack);
        let count = 0;
        for (const foundItem of foundItems) {
            count += foundItem.itemStack.amount;
        }
        DebugTimer.countEnd();
        return count;
    }

    /*
        @param {entity} The entity to check
        @param {itemStack} The item type to check
        @returns Whether the entity has the item in their inventory or equipment
    */
    static hasItem(entity: Entity, itemStack: ItemStack) {
        // Check if entity has item in inventory using findItem
        DebugTimer.countStart("InventoryUtil.hasItem");
        const result = this.getItemCount(entity, itemStack) > 0;
        DebugTimer.countEnd();
        return result;
    }

    /*
        @param {entity} The entity to clear the inventory of
    */
    static clearInventory(entity: Entity) {
        // Doesn't use clearInventorySlot or clearEquipmentSlot because it's faster to loop through all slots

        // Clear inventory by looping through all slots
        DebugTimer.countStart("InventoryUtil.clearInventory");
        const inventory = _InventoryUtil.getInventory(entity);
        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                inventory.setItem(i, undefined);
            }
        }

        // Clear equipment
        const equipment = _InventoryUtil.getEquipment(entity);
        if (equipment) {
            equipment.setEquipment(EquipmentSlot.Head, undefined);
            equipment.setEquipment(EquipmentSlot.Chest, undefined);
            equipment.setEquipment(EquipmentSlot.Legs, undefined);
            equipment.setEquipment(EquipmentSlot.Feet, undefined);
            equipment.setEquipment(EquipmentSlot.Offhand, undefined);
            equipment.setEquipment(EquipmentSlot.Mainhand, undefined);
        }
        DebugTimer.countEnd();
    }

    /*
        @param {entity} The entity to clear the slots of
        @param {entitySlots} The slots to clear
    */
    static clearSlots(entity: Entity, entitySlots: EntitySlot[]) {
        DebugTimer.countStart("InventoryUtil.clearSlots");
        for (const entitySlot of entitySlots) {
            this.clearSlot(entity, entitySlot);
        }
        DebugTimer.countEnd();
    }

    /*
        @param {entity} The entity to clear the inventory or equipment slot of
        @param {entitySlot} The slot to clear
    */
    static clearSlot(entity: Entity, entitySlot: EntitySlot) {
        DebugTimer.countStart("InventoryUtil.clearSlot");
        if (entitySlot.isEquipment) this.clearEquipmentSlot(entity, entitySlot.slot as EquipmentSlot);
        else this.clearInventorySlot(entity, entitySlot.slot as number);
        DebugTimer.countEnd();
    }

    /* 
        @param {entity} The entity to clear the inventory slot of
        @param {slot} The slot to clear
    */
    static clearInventorySlot(entity: Entity, slot: number) {
        DebugTimer.countStart("InventoryUtil.clearInventorySlot");
        const inventory = this.getInventory(entity);
        if (inventory) inventory.setItem(slot, undefined);
        DebugTimer.countEnd();
    }

    /*
        @param {entity} The entity to clear the equipment slot of
        @param {slot} The slot to clear
    */
    static clearEquipmentSlot(entity: Entity, slot: EquipmentSlot) {
        DebugTimer.countStart("InventoryUtil.clearEquipmentSlot");
        const equipment = this.getEquipment(entity);
        if (equipment) equipment.setEquipment(slot, undefined);
        DebugTimer.countEnd();
    }

    /*
        @param {entity} The entity to clear the item from
        @param {itemStack} The item stack to clear
    */
    static clearItem(entity: Entity, item: ItemStack) {
        DebugTimer.countStart("InventoryUtil.clearItem");
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
        DebugTimer.countEnd();
    }

    static clearItemByNameTag(entity: Entity, itemTypeName: string) {
        DebugTimer.countStart("InventoryUtil.clearItemByNameTag");
        const inventory = this.getInventory(entity);
        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (item && item.nameTag === itemTypeName) {
                    inventory.setItem(i, undefined);
                }
            }
        }
        DebugTimer.countEnd();
    }

    /*
        @param {entity} The entity to set the item in
        @param {itemStack} The item stack to set
        @param {entitySlot} The slot to set the item in
    */
    static setItem(entity: Entity, itemStack: ItemStack, entitySlot: EntitySlot) {
        DebugTimer.countStart("InventoryUtil.setItem");
        if (entitySlot.isEquipment) this.setEquipmentItem(entity, entitySlot.slot as EquipmentSlot, itemStack);
        else this.setInventoryItem(entity, itemStack, entitySlot.slot as number);
        DebugTimer.countEnd();
    }

    /**
     * Sets an item in the specified inventory slot of an entity.
     *
     * @param entity - The entity whose inventory will be modified.
     * @param itemStack - The item stack to set in the inventory slot.
     * @param slot - The inventory slot index where the item will be placed.
     * @param lockMode - Optional. The lock mode to apply to the item stack.
     */
    static setInventoryItem(entity: Entity, itemStack: ItemStack, slot: number, lockMode?: ItemLockMode) {
        DebugTimer.countStart("InventoryUtil.setInventoryItem");
        const inventory = this.getInventory(entity);
        if (inventory) {
            if (lockMode) itemStack.lockMode = lockMode;
            inventory.setItem(slot, itemStack);
        }
        DebugTimer.countEnd();
    }

    /**
     * Sets the selected slot for a player with the specified item stack and optional lock mode.
     *
     * @param player - The player whose selected slot is to be set.
     * @param itemStack - (Optional) The item stack to set in the selected slot.
     * @param lockMode - (Optional) The lock mode to apply to the item stack.
     */
    static setSelectedSlot(player: Player, itemStack?: ItemStack, lockMode?: ItemLockMode) {
        DebugTimer.countStart("InventoryUtil.setSelectedSlot");
        const inventory = this.getInventory(player);
        if (inventory) {
            if (itemStack && lockMode) itemStack.lockMode = lockMode;
            inventory.setItem(player.selectedSlotIndex, itemStack);
        }
        DebugTimer.countEnd();
    }

    static getOffhandItem(entity: Entity) {
        DebugTimer.countStart("InventoryUtil.getOffhandItem");
        const equipment = this.getEquipment(entity);
        const item = equipment?.getEquipment(EquipmentSlot.Offhand);
        DebugTimer.countEnd();
        return item;
    }

    /* 
        @param {entity} The entity to set the item in
        @param {itemStack} The item stack to set
        @param {slot} The slot to set the item in
    */
    static setEquipmentItem(entity: Entity, slot: EquipmentSlot, itemStack?: ItemStack) {
        DebugTimer.countStart("InventoryUtil.setEquipmentItem");
        const equipment = this.getEquipment(entity);
        if (!equipment) {
            console.warn(`Entity ${entity.typeId} does not have equipment`);
        } else {
            equipment.setEquipment(slot, itemStack);
        }
        DebugTimer.countEnd();
    }

    /* 
        @param {entity} The entity to give the item to
        @param {itemStack} The item stack to give
        @param {lockMode} The lock mode to apply to the item stack
    */
    static giveItem(entity: Entity, itemStack: ItemStack, lockMode?: ItemLockMode) {
        DebugTimer.countStart("InventoryUtil.giveItem");
        const inventory = this.getInventory(entity);
        if (inventory) {
            if (lockMode) itemStack.lockMode = lockMode;
            inventory.addItem(itemStack);
        }
    }

    /*
        @param {entity} The entity to give the items to
        @param {itemStacks} The item stacks to give
    */
    static giveItems(entity: Entity, itemStacks: ItemStack[]) {
        DebugTimer.countStart("InventoryUtil.giveItems");
        for (const itemStack of itemStacks) {
            this.giveItem(entity, itemStack);
        }
        DebugTimer.countEnd();
    }

    static selectedItem(player: Player): ItemStack | undefined {
        DebugTimer.countStart("InventoryUtil.selectedItem");
        const inventory = this.getInventory(player);
        const selectedItem = inventory?.getItem(player.selectedSlotIndex);
        DebugTimer.countEnd();

        return selectedItem;
    }

    static consumeSelectedItem(player: Player): ItemStack | undefined {
        DebugTimer.countStart("InventoryUtil.consumeSelectedItem");
        const item = this.selectedItem(player);
        if (!item) return undefined;

        if (item.amount === 1) this.setSelectedSlot(player, undefined);
        else {
            item.amount--;
            this.setSelectedSlot(player, item);
        }

        DebugTimer.countEnd();
    }

    static emptySlotsCount(entity: Entity): number {
        DebugTimer.countStart("InventoryUtil.emptySlotsCount");
        const inventory = this.getInventory(entity);
        DebugTimer.countEnd();
        return inventory?.emptySlotsCount ?? 0;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var InventoryUtil: Omit<typeof _InventoryUtil, "prototype">;
}
globalThis.InventoryUtil = _InventoryUtil;
