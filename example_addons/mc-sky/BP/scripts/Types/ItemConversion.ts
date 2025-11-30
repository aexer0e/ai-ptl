import { ItemStack } from "@minecraft/server";

export interface ItemConversionMap {
    [key: string]: {
        conversions: ItemConversion[];
    };
}

export interface ItemConversion {
    with: string[];
    convertsTo?: string;
    byproducts?: ItemStack[];
    parentDurabilityChange?: number;
    selfDurabilityChange?: number;
    swap?: boolean;
}
