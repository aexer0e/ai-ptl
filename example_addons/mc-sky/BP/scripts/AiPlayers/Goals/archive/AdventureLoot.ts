import { ItemStack } from "@minecraft/server";
import InventoryUtil from "Utilities/InventoryUtil";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        const biomeCount = this.getRandomInt(1, 3);
        const biomes = this.rollBiome(biomeCount);

        biomes.forEach((biome) => {
            const itemTypeCount = this.getRandomInt(0, 3);
            const items = this.rollItemsForBiome(biome, itemTypeCount);

            items.forEach((item) => {
                InventoryUtil.giveItems(this.entity, [item]);
            });
        });
    }

    getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    rollBiome(count: number): string[] {
        const availableBiomes = [
            "snow",
            "desert",
            "mesa",
            "flower",
            "forest",
            "savannah",
            "mushroom",
            "jungle",
            "ocean",
            "stone",
            "blossom",
            "taiga",
            "mangrove",
        ];

        const selectedBiomes: string[] = [];
        const availableBiomesCopy = [...availableBiomes];

        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * availableBiomesCopy.length);
            selectedBiomes.push(availableBiomesCopy[randomIndex]);
            availableBiomesCopy.splice(randomIndex, 1); // Remove the selected biome to ensure no duplicates
        }

        return selectedBiomes;
    }

    rollItemsForBiome(biome: string, count: number): ItemStack[] {
        const biomeItems = {
            snow: [
                { type: "minecraft:snowball", maxQuantity: 8 },
                { type: "minecraft:spruce_log", maxQuantity: 5 },
                { type: "minecraft:dirt", maxQuantity: 8 },
            ],
            desert: [
                { type: "minecraft:sand", maxQuantity: 8 },
                { type: "minecraft:cactus", maxQuantity: 8 },
                { type: "minecraft:rabbit_hide", maxQuantity: 3 },
                { type: "minecraft:stick", maxQuantity: 8 },
            ],
            mesa: [
                { type: "minecraft:hardened_clay", maxQuantity: 32 },
                { type: "minecraft:raw_gold", maxQuantity: 4 },
                { type: "minecraft:rail", maxQuantity: 8 },
                { type: "minecraft:stick", maxQuantity: 4 },
                { type: "minecraft:dirt", maxQuantity: 8 },
                { type: "minecraft:sand", maxQuantity: 8 },
            ],
            flower: [
                { type: "minecraft:poppy", maxQuantity: 2 },
                { type: "minecraft:blue_orchid", maxQuantity: 2 },
                { type: "minecraft:allium", maxQuantity: 2 },
                { type: "minecraft:azure_bluet", maxQuantity: 2 },
                { type: "minecraft:red_tulip", maxQuantity: 2 },
                { type: "minecraft:orange_tulip", maxQuantity: 2 },
                { type: "minecraft:white_tulip", maxQuantity: 2 },
                { type: "minecraft:pink_tulip", maxQuantity: 2 },
                { type: "minecraft:oxeye_daisy", maxQuantity: 2 },
                { type: "minecraft:cornflower", maxQuantity: 2 },
                { type: "minecraft:lily_of_the_valley", maxQuantity: 2 },
                { type: "minecraft:rose_bush", maxQuantity: 2 },
                { type: "minecraft:peony", maxQuantity: 2 },
                { type: "minecraft:sunflower", maxQuantity: 2 },
                { type: "minecraft:lilac", maxQuantity: 2 },
                { type: "minecraft:dirt", maxQuantity: 8 },
            ],
            forest: [
                { type: "minecraft:oak_log", maxQuantity: 5 },
                { type: "minecraft:birch_log", maxQuantity: 5 },
                { type: "minecraft:apple", maxQuantity: 2 },
                { type: "minecraft:stick", maxQuantity: 5 },
                { type: "minecraft:oak_sapling", maxQuantity: 3 },
                { type: "minecraft:birch_sapling", maxQuantity: 3 },
                { type: "minecraft:poppy", maxQuantity: 2 },
                { type: "minecraft:azure_bluet", maxQuantity: 2 },
                { type: "minecraft:sunflower", maxQuantity: 2 },
                { type: "minecraft:lilac", maxQuantity: 2 },
                { type: "minecraft:dirt", maxQuantity: 8 },
                { type: "minecraft:cobblestone", maxQuantity: 4 },
                { type: "minecraft:flint", maxQuantity: 2 },
                { type: "minecraft:gravel", maxQuantity: 6 },
            ],
            savannah: [
                { type: "minecraft:acacia_log", maxQuantity: 5 },
                { type: "minecraft:wheat_seeds", maxQuantity: 6 },
                { type: "minecraft:stick", maxQuantity: 6 },
                { type: "minecraft:acacia_sapling", maxQuantity: 3 },
                { type: "minecraft:dirt", maxQuantity: 5 },
                { type: "minecraft:cobblestone", maxQuantity: 5 },
                { type: "minecraft:flint", maxQuantity: 2 },
                { type: "minecraft:gravel", maxQuantity: 6 },
            ],
            mushroom: [
                { type: "minecraft:red_mushroom", maxQuantity: 4 },
                { type: "minecraft:brown_mushroom", maxQuantity: 4 },
                { type: "minecraft:mushroom_stew", maxQuantity: 1 },
                { type: "minecraft:dirt", maxQuantity: 5 },
                { type: "minecraft:leather", maxQuantity: 2 },
            ],
            jungle: [
                { type: "minecraft:jungle_log", maxQuantity: 5 },
                { type: "minecraft:cocoa_beans", maxQuantity: 5 },
                { type: "minecraft:melon_slice", maxQuantity: 8 },
                { type: "minecraft:bamboo", maxQuantity: 8 },
                { type: "minecraft:dirt", maxQuantity: 6 },
            ],
            ocean: [
                { type: "minecraft:kelp", maxQuantity: 16 },
                { type: "minecraft:cod", maxQuantity: 3 },
                { type: "minecraft:tropical_fish", maxQuantity: 3 },
                { type: "minecraft:sand", maxQuantity: 5 },
                { type: "minecraft:dirt", maxQuantity: 10 },
                { type: "minecraft:cobblestone", maxQuantity: 4 },
                { type: "minecraft:flint", maxQuantity: 3 },
                { type: "minecraft:gravel", maxQuantity: 8 },
            ],
            stone: [
                { type: "minecraft:cobblestone", maxQuantity: 32 },
                { type: "minecraft:coal", maxQuantity: 5 },
                { type: "minecraft:raw_iron", maxQuantity: 4 },
                { type: "minecraft:flint", maxQuantity: 2 },
                { type: "minecraft:dirt", maxQuantity: 10 },
                { type: "minecraft:gravel", maxQuantity: 10 },
            ],
            blossom: [
                { type: "minecraft:cherry_log", maxQuantity: 4 },
                { type: "minecraft:cherry_sapling", maxQuantity: 2 },
                { type: "minecraft:honeycomb", maxQuantity: 4 },
            ],
            taiga: [
                { type: "minecraft:spruce_log", maxQuantity: 5 },
                { type: "minecraft:sweet_berries", maxQuantity: 8 },
                { type: "minecraft:mossy_cobblestone", maxQuantity: 16 },
            ],
            mangrove: [
                { type: "minecraft:mangrove_log", maxQuantity: 5 },
                { type: "minecraft:mangrove_propagule", maxQuantity: 5 },
                { type: "minecraft:mangrove_roots", maxQuantity: 5 },
                { type: "minecraft:waterlily", maxQuantity: 2 },
                { type: "minecraft:mud", maxQuantity: 32 },
            ],
        };

        const items = biomeItems[biome];
        const selectedItems: ItemStack[] = [];
        const availableItemsCopy = [...items];

        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * availableItemsCopy.length);
            const selectedItem = availableItemsCopy[randomIndex];
            const quantity = this.getRandomInt(1, selectedItem.maxQuantity);
            selectedItems.push(new ItemStack(selectedItem.type, quantity));
            availableItemsCopy.splice(randomIndex, 1); // Remove the selected item to ensure no duplicates
        }

        return selectedItems;
    }

    onExit() {}
}
