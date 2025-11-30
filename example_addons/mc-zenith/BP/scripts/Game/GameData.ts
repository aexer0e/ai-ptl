/* eslint-disable @typescript-eslint/naming-convention */

import { GameEvents } from "Types/GameEvents";
import V3 from "Wrappers/V3";

export interface FoodDataEntry {
    /** The amount of health this food item regenerates when eaten. */
    healthRegeneration: number;
}

class _GameData {
    static readonly NotificationPriority = {
        join: -1,
        parkour: 2,
        phud: 10,
    };

    static readonly ToLocations = {
        spawn: V3.grid(0, 0, 0),
        parkour: V3.grid(0, 0, 0),
    };

    static readonly DragonArmorItemTypeId = "gm1_zen:dragon_armor";

    static readonly RemoveDragonArmorItemTypeId = "minecraft:shears";

    static readonly RemoveDragonPaintItemTypeIds = ["minecraft:lava_bucket", "minecraft:water_bucket"];

    /** The item that will replace the item used to remove the dragon paint. */
    static readonly RemoveDragonPaintSpentItemTypeId = "minecraft:bucket";

    //#region Weapon IDs
    static readonly WeaponItemTypeIds = [
        "minecraft:trident",
        "minecraft:netherite_sword",
        "minecraft:diamond_sword",
        "minecraft:golden_sword",
        "minecraft:iron_sword",
        "minecraft:stone_sword",
        "minecraft:wooden_sword",
        "minecraft:netherite_axe",
        "minecraft:diamond_axe",
        "minecraft:golden_axe",
        "minecraft:iron_axe",
        "minecraft:stone_axe",
        "minecraft:wooden_axe",
        "minecraft:netherite_pickaxe",
        "minecraft:diamond_pickaxe",
        "minecraft:golden_pickaxe",
        "minecraft:iron_pickaxe",
        "minecraft:stone_pickaxe",
        "minecraft:wooden_pickaxe",
    ];
    //#endregion
    //#region Food IDs
    static readonly FoodData: Record<string, Record<string, FoodDataEntry>> = {
        Meat: {
            "minecraft:rotten_flesh": { healthRegeneration: 4 },
            "minecraft:porkchop": { healthRegeneration: 4 },
            "minecraft:mutton": { healthRegeneration: 4 },
            "minecraft:rabbit": { healthRegeneration: 4 },
            "minecraft:chicken": { healthRegeneration: 4 },
            "minecraft:beef": { healthRegeneration: 4 },
            "minecraft:cooked_rabbit": { healthRegeneration: 4 },
            "minecraft:cooked_porkchop": { healthRegeneration: 4 },
            "minecraft:cooked_mutton": { healthRegeneration: 4 },
            "minecraft:cooked_chicken": { healthRegeneration: 4 },
            "minecraft:cooked_beef": { healthRegeneration: 4 },
        },
        Fish: {
            "minecraft:tropical_fish": { healthRegeneration: 4 },
            "minecraft:salmon": { healthRegeneration: 4 },
            "minecraft:pufferfish": { healthRegeneration: 4 },
            "minecraft:cod": { healthRegeneration: 4 },
            "minecraft:cooked_salmon": { healthRegeneration: 4 },
            "minecraft:cooked_cod": { healthRegeneration: 4 },
        },
        Rock: {
            "minecraft:andesite": { healthRegeneration: 4 },
            "minecraft:diorite": { healthRegeneration: 4 },
            "minecraft:cobblestone": { healthRegeneration: 4 },
            "minecraft:mossy_cobblestone": { healthRegeneration: 4 },
            "minecraft:stone": { healthRegeneration: 4 },
            "minecraft:calcite": { healthRegeneration: 4 },
            "minecraft:granite": { healthRegeneration: 4 },
            "minecraft:tuff": { healthRegeneration: 4 },
            "minecraft:deepslate": { healthRegeneration: 4 },
            "minecraft:obsidian": { healthRegeneration: 4 },
            "minecraft:cobbled_deepslate": { healthRegeneration: 4 },
            "minecraft:sandstone": { healthRegeneration: 4 },
            "minecraft:red_sandstone": { healthRegeneration: 4 },
            "minecraft:blackstone": { healthRegeneration: 4 },
        },
    };
    //#endregion
    static readonly events = new EventEmitter<GameEvents>();

    //#endregion

    //#region Valid Dye
    // Mapping from full dye item ID to color name
    static readonly DyeColorMap = new Map<string, number>([
        ["minecraft:white_dye", 1],
        ["minecraft:orange_dye", 2],
        ["minecraft:magenta_dye", 3],
        ["minecraft:light_blue_dye", 4],
        ["minecraft:yellow_dye", 5],
        ["minecraft:lime_dye", 6],
        ["minecraft:pink_dye", 7],
        ["minecraft:gray_dye", 8],
        ["minecraft:light_gray_dye", 9],
        ["minecraft:cyan_dye", 10],
        ["minecraft:purple_dye", 11],
        ["minecraft:blue_dye", 12],
        ["minecraft:brown_dye", 13],
        ["minecraft:green_dye", 14],
        ["minecraft:red_dye", 15],
        ["minecraft:black_dye", 16],
    ]);
    //#endregion

    static readonly HostileEntityFamilies = new Set<string>([
        "eggman",
        "eggrobo",
        "adult_piglin",
        "arthropod",
        "bee",
        "blaze",
        "bogged",
        "breeze",
        "cavespider",
        "creaking",
        "creeper",
        "dragon",
        "drowned",
        "enderman",
        "endermite",
        "evocation_illager",
        "ghast",
        "guardian",
        "guardian_elder",
        "hoglin",
        "hoglin_adult",
        "hoglin_baby",
        "hoglin_huntable",
        "hostile",
        "husk",
        "illager",
        "magmacube",
        "monster",
        "panda_aggressive",
        "phantom",
        "piglin",
        "piglin_brute",
        "piglin_hunter",
        "pillager",
        "ravager",
        "spring",
        "shulker",
        "silverfish",
        "skeleton",
        "spider",
        "stray",
        "undead",
        "vex",
        "vindicator",
        "warden",
        "witch",
        "wither",
        "zoglin",
        "zoglin_adult",
        "zoglin_baby",
        "zombie",
        "zombie_pigman",
        "zombie_villager",
    ]);

    static readonly scaleMap: Record<string, string> = {
        "gm1_zen:nightfury": "gm1_zen:dragon_scale_nightfury",
        "gm1_zen:monstrousnightmare": "gm1_zen:dragon_scale_monstrous",
        "gm1_zen:hideouszippleback": "gm1_zen:dragon_scale_hideous",
        "gm1_zen:gronckle": "gm1_zen:dragon_scale_gronckle",
        "gm1_zen:deadlynadder": "gm1_zen:dragon_scale_deadly",
    };

    static readonly DragonTypeIds = new Set<string>([
        "gm1_zen:nightfury",
        "gm1_zen:monstrousnightmare",
        "gm1_zen:hideouszippleback",
        "gm1_zen:gronckle",
        "gm1_zen:deadlynadder",
    ]);

    static readonly CanPlaceOverBlocks = new Set<string>([
        "minecraft:oak_leaves",
        "minecraft:birch_leaves",
        "minecraft:jungle_leaves",
        "minecraft:dark_oak_leaves",
        "minecraft:spruce_leaves",
        "minecraft:mangrove_leaves",
        "minecraft:acacia_leaves",
        "minecraft:cherry_leaves",
        "minecraft:azalea_leaves",
        "minecraft:oak_sapling",
        "minecraft:leaves",
        "minecraft:leaves2",
        "minecraft:azalea_leaves_flowered",

        "minecraft:deadbush",
        "minecraft:short_grass",
        "minecraft:tall_grass",
        "minecraft:twisting_vines",
        "minecraft:vine",
        "minecraft:weeping_vines",

        //new as of update 1.21.70
        "minecraft:bush",
        "minecraft:firefly_bush",
        "minecraft:short_dry_grass",
        "minecraft:tall_dry_grass",
        "minecraft:cactus_flower",
        "minecraft:wildflowers",

        "minecraft:big_dripleaf",
        "minecraft:small_dripleaf_block",
        "minecraft:cave_vines",
        "minecraft:cave_vines_body_with_berries",
        "minecraft:cave_vines_head_with_berries",

        "minecraft:birch_sapling",
        "minecraft:jungle_sapling",
        "minecraft:dark_oak_sapling",
        "minecraft:spruce_sapling",
        "minecraft:mangrove_propagule",
        "minecraft:acacia_sapling",
        "minecraft:cherry_sapling",
        "minecraft:oak_sapling",
        "minecraft:azalea",
        "minecraft:flowering_azalea",
        "minecraft:pale_oak_sapling",

        "minecraft:mangrove_roots",
        "minecraft:muddy_mangrove_roots",
        "minecraft:hanging_roots",

        "minecraft:waterlily",
        "minecraft:seagrass",
        //crops
        "minecraft:bamboo_sapling",
        "minecraft:beetroot_seeds",
        "minecraft:beetroot",
        "minecraft:carrot",
        "minecraft:carrots",
        "minecraft:melon_seeds",
        "minecraft:melon_stem",
        "minecraft:melon_block",
        "minecraft:cocoa",
        "minecraft:cocoa_beans",
        "minecraft:potato",
        "minecraft:potatoes",
        "minecraft:pumpkin_seeds",
        "minecraft:pumpkin_stem",
        "minecraft:pumpkin",
        "minecraft:carved_pumpkin",
        "minecraft:sapling",
        "minecraft:sweet_berries",
        "minecraft:torchflower_seeds",
        "minecraft:wheat_seeds",
        "minecraft:wheat",
        "minecraft:hay_block",
        "minecraft:honeycomb_block",
        //flowers
        "minecraft:yellow_flower",
        "minecraft:red_flower",
        "minecraft:torchflower_crop",
        "minecraft:wither_rose",
        "minecraft:poppy",
        "minecraft:orchid",
        "minecraft:allium",
        "minecraft:cornflower",
        "minecraft:lily_of_the_valley",
        "minecraft:dandelion",
        "minecraft:pink_petals",
        "minecraft:blue_orchid",
        "minecraft:azure_bluet",
        "minecraft:orange_tulip",
        "minecraft:pink_tulip",
        "minecraft:red_tulip",
        "minecraft:white_tulip",
        "minecraft:oxeye_daisy",
        "minecraft:torchflower",
        "minecraft:double_plant",
        "minecraft:sunflower",
        "minecraft:lilac",
        "minecraft:fern",
        "minecraft:large_fern",
        "minecraft:rose_bush",
        "minecraft:peony",
        "minecraft:pitcher_plant",
        "minecraft:pitcher_crop",
        "minecraft:closed_eyeblossom",
        "minecraft:open_eyeblossom",
        "minecraft:chorus_flower",
        "minecraft:spore_blossom",
        "minecraft:sweet_berry_bush",
        "minecraft:air",
        //"minecraft:light_block",
        "minecraft:frog_spawn",
        "minecraft:brown_mushroom",
        "minecraft:red_mushroom",
        "minecraft:crimson_fungus",
        "minecraft:warped_fungus",
        "minecraft:glow_lichen",
        "minecraft:nether_sprouts",
        "minecraft:nether_wart",
        "minecraft:pitcher_pod",
        "minecraft:crimson_roots",
        "minecraft:warped_roots",
        //"minecraft:sculk_vein",
        "minecraft:chorus_plant",
    ]);
}

declare global {
    // eslint-disable-next-line no-var
    var GameData: Omit<typeof _GameData, "prototype">;
}
globalThis.GameData = _GameData;
