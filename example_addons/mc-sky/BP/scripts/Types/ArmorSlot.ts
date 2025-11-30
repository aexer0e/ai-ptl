export enum ArmorSlot {
    Head = "helmet",
    Body = "chestplate",
    Legs = "leggings",
    Feet = "boots",
}

export const ArmorSlotCommandIdMap = {
    [ArmorSlot.Head]: "head",
    [ArmorSlot.Body]: "chest",
    [ArmorSlot.Legs]: "legs",
    [ArmorSlot.Feet]: "feet",
};

export enum ArmorTier {
    None = "none",
    Leather = "leather",
    Golden = "golden",
    Chainmail = "chainmail",
    Iron = "iron",
    Diamond = "diamond",
    Netherite = "netherite",
}

export const ArmorTierValueMap: Record<ArmorTier, number> = {
    [ArmorTier.None]: 0,
    [ArmorTier.Leather]: 1,
    [ArmorTier.Golden]: 2,
    [ArmorTier.Chainmail]: 3,
    [ArmorTier.Iron]: 4,
    [ArmorTier.Diamond]: 5,
    [ArmorTier.Netherite]: 6,
};

export const ArmorTierMap = {
    0: ArmorTier.None,
    1: ArmorTier.Leather,
    2: ArmorTier.Golden,
    3: ArmorTier.Chainmail,
    4: ArmorTier.Iron,
    5: ArmorTier.Diamond,
    6: ArmorTier.Netherite,
};
