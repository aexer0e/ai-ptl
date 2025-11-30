import { Entity, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import GameData from "Game/GameData";
import { EntitySlot } from "Types/EntitySlot";

/**
 * Provides utility functions for interacting with an entity's inventory.
 *
 * @remarks
 * This class includes static methods to retrieve and manipulate the inventory
 * and equipment components of entities in the game.
 *
 * @example
 * ```typescript
 * const playerInventory = InventoryUtil.getInventory(player);
 * console.log(playerInventory.size); // Output: Size of the player's inventory
 *
 * const playerEquipment = InventoryUtil.getEquipment(player);
 * console.log(playerEquipment); // Output: Equipment component of the player
 * ```
 */
export default class InventoryUtil {
    /**
     * Retrieves the inventory container of a given entity.
     *
     * @param entity - The entity from which to get the inventory.
     * @returns The inventory container of the specified entity.
     */
    static getInventory(entity: Entity) {
        const inventoryComponent: EntityInventoryComponent = entity.getComponent("minecraft:inventory") as EntityInventoryComponent;
        return inventoryComponent.container;
    }

    /**
     * Retrieves the equipment component from the given entity. Only works on players.
     *
     * @param entity - The entity from which to get the equipment component.
     * @returns The equipment component of the entity.
     */
    static getEquipment(entity: Entity) {
        const equipmentComponent: EntityEquippableComponent = entity.getComponent("equippable") as EntityEquippableComponent;
        return equipmentComponent;
    }

    /**
     * Finds all instances of a specified item within an entity's inventory and equipment.
     *
     * @param entity - The entity whose inventory and equipment are to be searched.
     * @param itemStackToFind - The item stack to search for within the entity's inventory and equipment.
     * @returns An array of objects containing the found item stacks and their corresponding entity slots.
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

    /**
     * Retrieves the total count of a specific item within an entity's inventory.
     *
     * @param entity - The entity whose inventory is being searched.
     * @param itemStack - The item stack to count within the entity's inventory.
     * @returns The total count of the specified item in the entity's inventory.
     */
    static getItemCount(entity: Entity, itemStack: ItemStack) {
        const foundItems = this.findItem(entity, itemStack);
        let count = 0;
        for (const foundItem of foundItems) {
            count += foundItem.itemStack.amount;
        }
        return count;
    }

    /**
     * Checks if the specified entity has the given item stack in its inventory.
     *
     * @param entity - The entity whose inventory is to be checked.
     * @param itemStack - The item stack to look for in the entity's inventory.
     * @returns `true` if the entity has the item stack in its inventory, otherwise `false`.
     */
    static hasItem(entity: Entity, itemStack: ItemStack) {
        // Check if entity has item in inventory using findItem
        return this.getItemCount(entity, itemStack) > 0;
    }

    /**
     * Clears the inventory and equipment of the specified entity.
     *
     * This method loops through all inventory slots and sets them to `undefined`,
     * effectively clearing the inventory. It also clears all equipment slots
     * (head, chest, legs, feet, offhand, and mainhand) by setting them to `undefined`.
     *
     * @param entity - The entity whose inventory and equipment will be cleared.
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

    /**
     * Clears the specified slots of the given entity.
     *
     * @param entity - The entity whose slots are to be cleared.
     * @param entitySlots - An array of slots to be cleared.
     */
    static clearSlots(entity: Entity, entitySlots: EntitySlot[]) {
        for (const entitySlot of entitySlots) {
            this.clearSlot(entity, entitySlot);
        }
    }

    /**
     * Clears the specified slot of the given entity.
     *
     * @param entity - The entity whose slot needs to be cleared.
     * @param entitySlot - The slot of the entity to be cleared. It can be either an equipment slot or an inventory slot.
     */
    static clearSlot(entity: Entity, entitySlot: EntitySlot) {
        if (entitySlot.isEquipment) this.clearEquipmentSlot(entity, entitySlot.slot as EquipmentSlot);
        else this.clearInventorySlot(entity, entitySlot.slot as number);
    }

    /**
     * Clears the item in the specified inventory slot of the given entity.
     *
     * @param entity - The entity whose inventory slot is to be cleared.
     * @param slot - The slot number in the inventory to be cleared.
     */
    static clearInventorySlot(entity: Entity, slot: number) {
        const inventory = this.getInventory(entity);
        if (!inventory) return;
        inventory.setItem(slot, undefined);
    }

    /**
     * Clears the specified equipment slot of the given entity.
     *
     * @param entity - The entity whose equipment slot is to be cleared.
     * @param slot - The equipment slot to be cleared.
     */
    static clearEquipmentSlot(entity: Entity, slot: EquipmentSlot) {
        const equipment = this.getEquipment(entity);
        if (!equipment) return;
        equipment.setEquipment(slot, undefined);
    }

    /**
     * Clears a specified amount of an item from an entity's inventory.
     *
     * @param entity - The entity from which the item will be cleared.
     * @param item - The item stack to be cleared, including the amount to clear.
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

    /**
     * Clears items from an entity's inventory based on the specified item name tag.
     *
     * @param entity - The entity whose inventory will be checked.
     * @param itemTypeName - The name tag of the item to be cleared from the inventory.
     */
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

    /**
     * Sets an item in the specified slot of an entity's inventory or equipment. Destroys the item in the current slot.
     *
     * @param entity - The entity whose inventory or equipment is being modified.
     * @param itemStack - The item stack to set in the specified slot.
     * @param entitySlot - The slot in the entity's inventory or equipment where the item will be placed.
     */
    static setItem(entity: Entity, itemStack: ItemStack, entitySlot: EntitySlot) {
        if (entitySlot.isEquipment) this.setEquipmentItem(entity, entitySlot.slot as EquipmentSlot, itemStack);
        else this.setInventoryItem(entity, itemStack, entitySlot.slot as number);
    }

    /**
     * Sets an item in the specified inventory slot of the given entity. Destroys the item in the current slot
     *
     * @param entity - The entity whose inventory is being modified.
     * @param itemStack - The item stack to set in the inventory slot.
     * @param slot - The slot number in the inventory where the item stack will be placed.
     */
    static setInventoryItem(entity: Entity, itemStack: ItemStack, slot: number) {
        const inventory = this.getInventory(entity);
        if (!inventory) return;
        inventory.setItem(slot, itemStack);
        if (entity instanceof Player) this.onPlayerGivenItem(entity, itemStack);
    }

    /**
     * Emits an event when a player is given an item.
     *
     * @param player - The player who is given the item.
     * @param itemStack - The item stack that is given to the player.
     */
    private static onPlayerGivenItem(player: Player, itemStack: ItemStack) {
        GameData.events.emit("PlayerGivenItem", player, itemStack);
    }

    /**
     * Sets the selected slot of the player's inventory to the specified item stack.
     * If an item stack is provided, it will be placed in the selected slot.
     * If no item stack is provided, the selected slot will be cleared.
     *
     * @param player - The player whose selected slot is to be set.
     * @param itemStack - The item stack to place in the selected slot (optional).
     */
    static setSelectedSlot(player: Player, itemStack?: ItemStack) {
        const inventory = this.getInventory(player);
        if (!inventory) return;
        inventory.setItem(player.selectedSlotIndex, itemStack);
        if (itemStack) this.onPlayerGivenItem(player, itemStack);
    }

    /**
     * Sets an equipment item for a given entity in the specified equipment slot.
     *
     * @param entity - The entity for which the equipment item is to be set.
     * @param slot - The equipment slot where the item will be placed.
     * @param itemStack - (Optional) The item stack to be placed in the equipment slot.
     *
     * @remarks
     * If the entity does not have equipment, a warning will be logged to the console.
     * If the entity is a player and an item stack is provided, 'PlayerGivenItem' will trigger
     */
    static setEquipmentItem(entity: Entity, slot: EquipmentSlot, itemStack?: ItemStack) {
        const equipment = this.getEquipment(entity);
        if (!equipment) return console.warn(`Entity ${entity.typeId} does not have equipment`);
        equipment.setEquipment(slot, itemStack);
        if (entity instanceof Player && itemStack) this.onPlayerGivenItem(entity, itemStack);
    }

    /**
     * Gives an item to the specified entity. If the entity is a player,
     *
     * @param entity - The entity to which the item will be given.
     * @param itemStack - The item stack to be given to the entity.
     * 'PlayerGivenItem' will trigger
     */
    static giveItem(entity: Entity, itemStack: ItemStack) {
        const inventory = this.getInventory(entity);
        if (!inventory) return;
        inventory.addItem(itemStack);
        if (entity instanceof Player) this.onPlayerGivenItem(entity, itemStack);
    }

    /**
     * Gives multiple items to the specified entity.
     *
     * @param entity - The entity to which the items will be given.
     * @param itemStacks - An array of ItemStack objects representing the items to be given.
     */
    static giveItems(entity: Entity, itemStacks: ItemStack[]) {
        for (const itemStack of itemStacks) {
            this.giveItem(entity, itemStack);
        }
    }

    /**
     * Retrieves the currently selected item from the player's inventory.
     *
     * @param player - The player whose selected item is to be retrieved.
     * @returns The `ItemStack` representing the selected item, or `undefined` if the inventory is not available.
     */
    static selectedItem(player: Player): ItemStack | undefined {
        const inventory = this.getInventory(player);
        if (!inventory) return;
        const selectedItem = inventory.getItem(player.selectedSlotIndex);

        return selectedItem;
    }

    /**
     * Calculates the number of empty slots in the inventory of the given entity.
     *
     * @param entity - The entity whose inventory is being checked.
     * @returns The number of empty slots in the entity's inventory.
     */
    static emptySlotsCount(entity: Entity): number {
        const inventory = this.getInventory(entity);
        return inventory?.emptySlotsCount ?? 0;
    }
}
