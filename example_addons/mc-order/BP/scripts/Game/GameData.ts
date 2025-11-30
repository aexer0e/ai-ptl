import { EntityDamageCause } from "@minecraft/server";
import { GameEvents } from "Types/GameEvents";
import EventEmitter from "Utilities/EventEmitter";
import V3 from "Wrappers/V3";

/**
 * Represents the game data and provides a static event emitter for game events.
 *
 * @remarks
 * This class is designed to be used as a singleton and should not be instantiated.
 *
 * @example
 * ```typescript
 * GameData.events.on('eventName', (event) => {
 *   // handle event
 * });
 * ```
 */
//#region Modular Abilities
export enum SneakAbilityTypes {
    Spindash,
    /**
     * SPINDASH VARIABLES:
    exitSpindashMomentum: 40,
    stopBlockBreakingMomentum: 84,
    spindashDeceleration: 0.16,
    blockBreakForwardOffset: 1.0,
    abilityTiers: [
        {
            sneakTicks: 0,
            momentum: 54,
            forwardKnockback: 3,
            bounceDamage: 20,
        },
        {
            sneakTicks: 25,
            momentum: 60,
            forwardKnockback: 3.5,
            bounceDamage: 20,
        },
        {
            sneakTicks: 40,
            momentum: 67,
            forwardKnockback: 4,
            bounceDamage: 20,
        },
        {
            sneakTicks: 47,
            momentum: 75,
            forwardKnockback: 4.5,
            bounceDamage: 20,
        },
        {
            sneakTicks: 50,
            momentum: 85,
            forwardKnockback: 5.0,
            bounceDamage: 40,
        },
    ],
    verticalKnockbackRanks: [
        [0.0, 0.0],
        [0.1, 0.2],
        [0.2, 0.4],
        [0.3, 0.6],
        [0.4, 0.8],
        [0.5, 1.0],
    ],
     */
    Hammer,
    /**
     * HAMMER VARIABLES:
    impactNotificationTicks: 10,
    hammerFlyIntoEntityRange: 1.5,
    postHammerRunnableTicks: 20,
    hammerVelocityMap: [-0.5, -3.0],
    hammerAOEMultiplierMap: [1.5, 2],
    verticalKnockbackRanks: [0.4, 0.7, 0.9, 1.1, 1.3, 1.5],
    abilityTiers: [
        {
            sneakTicks: 0,
            momentum: 48,
            forwardKnockback: 3.0,
            damage: 20,
            radius: 5,
            targetHKnockback: 2,
            targetVKnockback: 0.5,
        },
        {
            sneakTicks: 15,
            momentum: 53,
            forwardKnockback: 5.0,
            damage: 20,
            radius: 6,
            targetHKnockback: 2.5,
            targetVKnockback: 0.75,
        },
        {
            sneakTicks: 30,
            momentum: 59,
            forwardKnockback: 4.5,
            damage: 20,
            radius: 7,
            targetHKnockback: 3,
            targetVKnockback: 1.0,
        },
        {
            sneakTicks: 37,
            momentum: 67,
            forwardKnockback: 5.5,
            damage: 30,
            radius: 8,
            targetHKnockback: 4,
            targetVKnockback: 1.25,
        },
        {
            sneakTicks: 45,
            momentum: 76,
            forwardKnockback: 6.5,
            damage: 30,
            radius: 10,
            targetHKnockback: 5,
            targetVKnockback: 1.5,
        },
    ],
     */
    Punch,
    /**
     * PUNCH VARIABLES:
    exitPunchMomentum: 47,
    punchDeceleration: 3.8,
    impactNotificationTicks: 8,
    postPunchRunnableTicks: 20,
    blockBreakForwardOffset: 1,
    verticalKnockbackRanks: [0.0, 0.0, 0.4, 0.6, 0.8, 1.0],
    abilityTiers: [
        {
            sneakTicks: 0,
            momentum: 48,
            damage: 20,
            targetHKnockback: 0.5,
            targetVKnockback: 0.5,
            damageRadius: 4.0,
            breaksBlocks: false,
            punchEntityDetectionRadius: 4,
            punchEntityForwardOffset: 1.25,
        },
        {
            sneakTicks: 4,
            momentum: 53,
            damage: 20,
            targetHKnockback: 0.75,
            targetVKnockback: 0.5,
            damageRadius: 5.0,
            breaksBlocks: true,
            punchEntityDetectionRadius: 5,
            punchEntityForwardOffset: 1.75,
        },
        {
            sneakTicks: 30,
            momentum: 59,
            damage: 20,
            targetHKnockback: 1.0,
            targetVKnockback: 0.5,
            damageRadius: 6.0,
            breaksBlocks: true,
            punchEntityDetectionRadius: 6,
            punchEntityForwardOffset: 2,
        },
        {
            sneakTicks: 47,
            momentum: 67,
            damage: 20,
            targetVKnockback: 0.5,
            targetHKnockback: 1.25,
            damageRadius: 7.0,
            breaksBlocks: true,
            punchEntityDetectionRadius: 7,
            punchEntityForwardOffset: 3,
        },
        {
            sneakTicks: 50,
            momentum: 76,
            damage: 20,
            targetHKnockback: 1.5,
            targetVKnockback: 0.5,
            damageRadius: 8.0,
            breaksBlocks: true,
            punchEntityDetectionRadius: 8,
            punchEntityForwardOffset: 4,
        },
    ],
     */
    Dash,
    /**
     * DASH VARIABLES:
    dashKnockback: 14, // In effect, determines how quickly the Dash is executed
    dashDelay: 2, // In ticks
    dashMinPitchForV: 20,
    blockBreakForwardOffset: 3,
    postDashVKnockback: 0.02, // Affected by dash direction, doesn't apply when looking straight ahead
    postDashRunnableTicks: 20,
    abilityTiers: [
        {
            sneakTicks: 0,
            momentum: 58,
            maxDistance: 15,
            killRadius: 4.25,
            breaksBlocks: false,
            dashSlowKillDamage: 10,
        },
        {
            sneakTicks: 15,
            momentum: 64,
            maxDistance: 18,
            killRadius: 5.25,
            breaksBlocks: false,
            dashSlowKillDamage: 10,
        },
        {
            sneakTicks: 30,
            momentum: 71,
            maxDistance: 21,
            killRadius: 6.25,
            breaksBlocks: false,
            dashSlowKillDamage: 10,
        },
        {
            sneakTicks: 37,
            momentum: 80,
            maxDistance: 25,
            killRadius: 7.25,
            breaksBlocks: false,
            dashSlowKillDamage: 10,
        },
        {
            sneakTicks: 45,
            momentum: 90,
            maxDistance: 25,
            killRadius: 8.25,
            breaksBlocks: true,
            dashSlowKillDamage: 20,
        },
    ],
     */
    Boost,
    /**
     * BOOST VARIABLES:
    boostGroundMomentum: 70,
    boostKillRadius: 6,
    blockBreakForwardOffset: 1.0,
    boostSlowKillDamage: 10,
    boostHoverAntiGravity: 0.043,
    boostDescentYKnockback: -0.05,
    multiHomingPause: 0,
    abilityTiers: [
        {
            sneakTicks: 0,
            forwardKnockback: 2,
            upKnockback: 2,
        },
        {
            sneakTicks: 15,
            forwardKnockback: 2,
            upKnockback: 2,
        },
        {
            sneakTicks: 30,
            forwardKnockback: 2,
            upKnockback: 2,
        },
        {
            sneakTicks: 37,
            forwardKnockback: 2,
            upKnockback: 2,
        },
        {
            sneakTicks: 45,
            forwardKnockback: 3,
            upKnockback: 4,
        },
    ],
    // Boost flight variables
    flightKnockback: 2.0,
    flightKnockbackAntiGravity: 0.05,
    postFlightSlowFallTime: 4 * 20,
    postFlightSlowFallAmplifier: 1,
     */
}
export enum JumpAbilityTypes {
    DoubleJump,
    /**
     * DOUBLE JUMP VARIABLES:
    doubleJumpForceV: 1, // In whatever unit knockback uses
    doubleJumpCommTicks: 2,
    doubleJumpForwardKnockbackMult: 5,
    doubleJumpVKnockbackMult: 0.75,
     */
    Hover,
    /**
     * HOVER VARIABLES:
    hoverDuration: 2.5, // Seconds before only going down
    hoverUpCycleKnockback: 0.1,
    hoverDownCycleKnockback: 0.01, // Low positive or zero values like 0.01 or 0.0 will still make the character fall slowly
    hoverFallKnockbackSpeed: 0.00009, // Low positive or zero values like 0.01 or 0.0 will still make the character fall slowly
    hoverBoost: 0.2,
    hoverBoostTicks: 8,
    hoverCycleTime: 0.75, // Seconds each going up and down
    hoverMomentumCap: 40,
    hoverMomentumMin: 32,
     */
    Glide,
    /**
     * GLIDE VARIABLES:
    glideDownKnockback: 0.015,
    glideAcceleration: 0.75,
    glideMomentumCap: 52.5,
    glideMomentumMin: 30,
     */
    Homing,
    /**
     * HOMING VARIABLES:
    nonHomingPushMomentum: 10,
    nonHomingPushHKnockback: 3,
    nonHomingPushVKnockback: 0.3,
    homingRayRange: 5.5,
    homingRayRadius: 4.0,
    homingPotentialTargetParticle: "gm1_ord:ring_sparkle",
    homingActiveTargetParticle: "chaos:ring_firework",
    homingKnockbackFar: 1.5,
    homingKnockbackClose: 1.25,
    homingCloseThreshold: 3.0,
     */
    MultiHoming,
    /**
     * MULTI-HOMING VARIABLES:
     * SAME AS HOMING, except add this line:
    homingKnockbackAntiGravity: 0.05,
     */
}
//#endregion

export default class GameData {
    static readonly events = new EventEmitter<GameEvents>();

    // See this Notion page for documentation:
    // https://www.notion.so/gamemodeone/Exposed-Variable-List-Game-Design-Guide-1375b87413438012b039e11d0415b314

    static readonly EndInvulnerabilityDelay = 1.0; // In seconds
    static readonly BadnikBounceBufferTicks = 5;

    static readonly EffectImmunities = ["hunger", "poison", "fatal_poison", "wither"];

    //#region Running Lists
    static readonly DontPlaceSlabsOn = new Set([
        // Because this would be silly
        "gm1_ord:invisible_slab",
        "minecraft:bamboo",
        "minecraft:reeds",
        "minecraft:flower_pot",
        "minecraft:structure_void",
        "minecraft:structure_block",

        "minecraft:wood",
        "minecraft:cherry_wood",
        "minecraft:stripped_cherry_wood",
        "minecraft:mangrove_wood",
        "minecraft:stripped_mangrove_wood",
        "minecraft:pale_oak_wood",
        //"mincraft:water",
        //"mincraft:flowing_water",
        // Because we're constantly deleting them
        "minecraft:oak_leaves",
        "minecraft:birch_leaves",
        "minecraft:jungle_leaves",
        "minecraft:dark_oak_leaves",
        "minecraft:spruce_leaves",
        "minecraft:mangrove_leaves",
        "minecraft:acacia_leaves",
        "minecraft:cherry_leaves",
        "minecraft:azalea_leaves",
        "minecraft:pale_oak_leaves",

        //man-made
        "minecraft:detector_rail",
        "minecraft:rail",
        "minecraft:golden_rail",
        "minecraft:redstone_wire",
        "minecraft:trip_wire",
        "minecraft:trip_wire_hook",
        "minecraft:torch",
        "minecraft:redstone_torch",
        "minecraft:unlit_redstone_torch",
        "minecraft:soul_torch",
        //not on ground
        "minecraft:web",
        "minecraft:chorus_flower",
        "minecraft:chorus_plant",
        "minecraft:cocoa",
        "minecraft:glow_berries",
        "minecraft:vine",
        "minecraft:cave_vines_body_with_berries",
        "minecraft:cave_vines_head_with_berries",
        "minecraft:cave_vines",
        "minecraft:hanging_roots",
        "minecraft:spore_blossom",
        "minecraft:mangrove_propagule",
        "minecraft:pale_hanging_moss",

        //special cases
        "minecraft:end_gateway",
        "minecraft:end_portal",
        "minecraft:portal", //nether portal
        "minecraft:turtle_egg",
        "minecraft:twisting_vines",
        "minecraft:vine",
        "minecraft:weeping_vines",
        "minecraft:small_amethyst_bud",
        "minecraft:medium_amethyst_bud",
        "minecraft:large_amethyst_bud",
        "minecraft:amethyst_cluster",
        "minecraft:creaking_heart",
        //slowed
        "minecraft:soul_sand",
        "minecraft:mud",
        "minecraft:honey_block",
        //weird behaviours
        //"minecraft:grass_path",
        //"minecraft:farmland",

        /* to test
        "minecraft:standing_banner",
        buttons
        ladder
        lever
        sign
        skull
        pressure plate
        redstone comparator
        redstone repeater
        "minecraft:big_dripleaf",
        sweet_berry_bush
        stairs
        candles
        */
    ]);
    static readonly SingleTallReplaceables = new Set<string>([
        "minecraft:air",
        "minecraft:light_block",
        "minecraft:deadbush",
        "minecraft:frog_spawn",
        "minecraft:brown_mushroom",
        "minecraft:red_mushroom",
        "minecraft:glow_lichen",
        "minecraft:pitcher_pod",
        "minecraft:sculk_vein",
        "minecraft:short_grass",
        "minecraft:fern",
        "minecraft:small_dripleaf_block",
        "minecraft:vine",
        "minecraft:cave_vines",
        "minecraft:cave_vines_body_with_berries",
        "minecraft:cave_vines_head_with_berries",
        "minecraft:pale_hanging_moss",
        "minecraft:pale_moss_carpet",
        "minecraft:snow_layer",
        "minecraft:moss_carpet",

        //crops
        "minecraft:beetroot_seeds",
        "minecraft:beetroot",
        "minecraft:carrot",
        "minecraft:carrots",
        "minecraft:melon_seeds",
        "minecraft:melon_stem",
        "minecraft:cocoa_beans",
        "minecraft:potato",
        "minecraft:potatoes",
        "minecraft:pumpkin_seeds",
        "minecraft:pumpkin_stem",
        "minecraft:sweet_berries",
        "minecraft:sweet_berry_bush",
        "minecraft:torchflower_seeds",
        "minecraft:wheat_seeds",
        "minecraft:wheat",
        "minecraft:brown_mushroom",
        "minecraft:red_mushroom",
        //saplings and roots
        "minecraft:sapling",
        "minecraft:pale_oak_sapling",
        "minecraft:bamboo_sapling",
        "minecraft:oak_sapling",
        "minecraft:birch_sapling",
        "minecraft:jungle_sapling",
        "minecraft:dark_oak_sapling",
        "minecraft:spruce_sapling",
        "minecraft:acacia_sapling",
        "minecraft:cherry_sapling",
        "minecraft:mangrove_propagule",
        "minecraft:azalea",
        "minecraft:flowering_azalea",
        "minecraft:mangrove_roots",
        "minecraft:muddy_mangrove_roots",
        "minecraft:hanging_roots",
        //flowers
        "minecraft:yellow_flower",
        "minecraft:red_flower",
        "minecraft:torchflower_crop",
        "minecraft:wither_rose",
        "minecraft:poppy",
        "minecraft:orchid",
        "minecraft:allium",
        "minecraft:houstonia",
        "minecraft:tulip_red",
        "minecraft:tulip_orange",
        "minecraft:tulip_white",
        "minecraft:tulip_pink",
        "minecraft:oxeye",
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
        "minecraft:pitcher_crop",
        "minecraft:closed_eyeblossom",
        "minecraft:open_eyeblossom",
        "minecraft:spore_blossom",

        "minecraft:waterlily",
        //for running underwater (probably don't need, but maybe other add-ons might?):
        "minecraft:tube_coral",
        "minecraft:brain_coral",
        "minecraft:bubble_coral",
        "minecraft:fire_coral",
        "minecraft:horn_coral",
        "minecraft:dead_tube_coral",
        "minecraft:dead_brain_coral",
        "minecraft:dead_bubble_coral",
        "minecraft:dead_fire_coral",
        "minecraft:dead_horn_coral",
        "minecraft:coral_fan",
        "minecraft:coral_fan_dead",
        "minecraft:coral_fan_hang",
        "minecraft:coral_fan_hang2",
        "minecraft:coral_fan_hang3",
        "minecraft:kelp",
        "minecraft:sea_pickle",
        //nether and end
        "minecraft:crimson_fungus",
        "minecraft:warped_fungus",
        "minecraft:nether_wart",
        "minecraft:nether_sprouts",
        "minecraft:crimson_roots",
        "minecraft:warped_roots",
        "minecraft:twisting_vines",
        "minecraft:weeping_vines",
        "minecraft:chorus_flower",
        "minecraft:chorus_plant",
        //new as of update 1.21.70
        "minecraft:bush",
        "minecraft:firefly_bush",
        "minecraft:short_dry_grass",
        "minecraft:tall_dry_grass", //keep an eye on this one. it's currently only 1 block and doesn't grow double tall
        "minecraft:leaf_litter",
        "minecraft:cactus_flower",
        "minecraft:wildflowers",
    ]);
    static readonly DoubleTallReplaceables = new Set<string>([
        "minecraft:tall_grass",
        "minecraft:double_plant",
        "minecraft:sunflower",
        "minecraft:lilac", //syringa
        "minecraft:large_fern",
        "minecraft:rose_bush",
        "minecraft:peony",
        "minecraft:pitcher_plant",
        "minecraft:pitcher_crop",
        "minecraft:big_dripleaf",
    ]);
    static readonly RunBeakableBlocksFar = new Set<string>([
        "minecraft:oak_leaves",
        "minecraft:birch_leaves",
        "minecraft:jungle_leaves",
        "minecraft:dark_oak_leaves",
        "minecraft:spruce_leaves",
        "minecraft:mangrove_leaves",
        "minecraft:acacia_leaves",
        "minecraft:cherry_leaves",
        "minecraft:azalea_leaves",
        "minecraft:leaves",
        "minecraft:leaves2",
        "minecraft:azalea_leaves_flowered",
        "minecraft:pale_oak_leaves",
        "minecraft:pale_hanging_moss",

        "minecraft:snow_layer",
        "minecraft:moss_carpet",
        "minecraft:pale_moss_carpet",
    ]);
    static readonly RunBeakableBlocksClose = new Set<string>([
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
        //"minecraft:air",
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
    static readonly NoLootTableBlocks = new Set<string>(["minecraft:snow_layer"]);
    static readonly LiquidRunBlocks = new Set<string>(["minecraft:water", "minecraft:powder_snow"]);

    //#endregion

    //#region Attack Lists
    static readonly HostileTargetFamilies = new Set<string>([
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
    static readonly PassiveTargetFamilies = new Set<string>([
        "allay",
        "animal",
        "armadillo",
        "armorer",
        "artisan",
        "axolotl",
        "baby_turtle",
        "bat",
        "blacksmith",
        "butcher",
        "camel",
        "cartographer",
        "cat",
        "chicken",
        "cleric",
        "cod",
        "cow",
        "dolphin",
        "donkey",
        "farmer",
        "fish",
        "fisherman",
        "fletcher",
        "fox",
        "frog",
        "goat",
        "horse",
        "irongolem",
        "leatherworker",
        "librarian",
        "llama",
        "mule",
        "mushroomcow",
        "nitwit",
        "ocelot",
        "pacified",
        "panda",
        "parrot_tame",
        "parrot_wild",
        "peasant",
        "pig",
        "polarbear",
        "priest",
        "pufferfish",
        "rabbit",
        "salmon",
        "sheep",
        "shepherd",
        "skeletonhorse",
        "sniffer",
        "snowgolem",
        "squid",
        "stone_mason",
        "strider",
        "strider_adult",
        "strider_baby",
        "tadpole",
        "toolsmith",
        "trader_llama",
        "tropicalfish",
        "turtle",
        "unskilled",
        "villager",
        "wandering_trader",
        "wandering_trader_despawning",
        "weaponsmith",
        "wolf",
        "zombiehorse",
    ]);
    static readonly NeverTargetFamilies = new Set<string>(["ignore", "dev", "invincible"]);

    static readonly DashSlowKillFamilies = new Set<string>(["wither", "dragon", "warden", "eggman"]);
    static readonly BoostSlowKillTypes = new Set<string>([
        "gm1_ord:eggman",
        "minecraft:wither",
        "minecraft:ender_dragon",
        "minecraft:warden",
    ]);
    static readonly BoostKillItemBlacklist = new Set<string>([
        //gm1
        "gm1_ord:chaos_drive",
        "gm1_ord:ring_spawn_egg",
        "gm1_ord:char_select_tv",
        "gm1_ord:tails_tinker_table",
        "gm1_ord:ring_pile",
        "gm1_ord:shrine_stone_bricks",
        "gm1_ord:shrine_stone_chiseled",
        "gm1_ord:shrine_stone_mossy",
        "gm1_ord:shrine_stone",
        //mining ores
        "minecraft:coal",
        "minecraft:coal_block",
        "minecraft:charcoal",
        "minecraft:raw_copper",
        "minecraft:copper_ingot",
        "minecraft:copper_block",
        "minecraft:raw_iron",
        "minecraft:iron_nugget",
        "minecraft:iron_ingot",
        "minecraft:iron_block",
        "minecraft:raw_gold",
        "minecraft:gold_nugget",
        "minecraft:gold_ingot",
        "minecraft:gold_block",
        "minecraft:diamond",
        "minecraft:diamond_block",
        "minecraft:emerald",
        "minecraft:emerald_block",
        "minecraft:lapis_lazuli",
        "minecraft:lapis_block",
        "minecraft:redstone",
        "minecraft:redstone_block",
        "minecraft:redstone_torch",
        "minecraft:torch",
        //warden
        "minecraft:sculk_catalyst",
        //nether
        "minecraft:quartz",
        "minecraft:quartz_block",
        "minecraft:ancient_debris",
        "minecraft:netherite_scrap",
        "minecraft:netherite_ingot",
        "minecraft:netherite_block",
        "minecraft:echo_shard",
        //wither
        "minecraft:nether_star",
        "minecraft:wither_skeleton_skull",
        //guardian
        "minecraft:prismarine",
        "minecraft:dark_prismarine",
        "minecraft:prismarine_shard",
        "minecraft:prismarine_crystals",
        //END
        "minecraft:purpur_block",
        "minecraft:obsidian",
        "minecraft:crying_obsidian",
        //trophies
        "minecraft:dragon_egg",
        "minecraft:dragon_head",
        "minecraft:creeper_head",
        "minecraft:piglin_head",
        "minecraft:player_head",
        "minecraft:zombie_head",
        "minecraft:skeleton_skull",
        "minecraft:wither_skeleton_skull",
        //other
        "minecraft:beacon",
        "minecraft:conduit",
        //functional blocks - these shouldn't be destructible anymore, but just in case they're added here as well
        "minecraft:brewing_stand",
        "minecraft:chest",
        "minecraft:ender_chest",
        "minecraft:chiseled_bookshelf",
        "minecraft:furnace",
        "minecraft:lit_furnace",
        "minecraft:blast_furnace",
        "minecraft:lit_blast_furnace",
        "minecraft:smoker",
        "minecraft:lit_smoker",
        "minecraft:lectern",
        "minecraft:undyed_shulker_box",
        "minecraft:white_shulker_box",
        "minecraft:orange_shulker_box",
        "minecraft:magenta_shulker_box",
        "minecraft:light_blue_shulker_box",
        "minecraft:yellow_shulker_box",
        "minecraft:lime_shulker_box",
        "minecraft:pink_shulker_box",
        "minecraft:gray_shulker_box",
        "minecraft:light_gray_shulker_box",
        "minecraft:cyan_shulker_box",
        "minecraft:purple_shulker_box",
        "minecraft:blue_shulker_box",
        "minecraft:brown_shulker_box",
        "minecraft:green_shulker_box",
        "minecraft:red_shulker_box",
        "minecraft:black_shulker_box",
        "minecraft:bed",
        "minecraft:respawn_anchor",
        "minecraft:hopper",
        "minecraft:dispenser",
        "minecraft:dropper",
        "minecraft:trapped_chest",
        "minecraft:vault",
    ]);

    static readonly NoBadnikDamageTypes = new Set<string>(["gm1_ord:lf_spring_yellow", "gm1_ord:lf_spring_red"]);

    //#endregion

    //#region Character variables
    static readonly SneakSlowness = 3.5;
    static readonly SlowTicksBeforeHomingEnd = 10;
    static readonly HomingSlowThreshold = 0.2;
    static readonly HomingTimeout = 1.5 * 20;
    static readonly SuperRingPickupRange = 0.8;
    static readonly RingMagnetMaxSpeed = 1.5;

    static readonly CharDesignVars = {
        "gm1_ord:sonic_life": {
            // General variables
            maxMomentum: 75, //4.5x Steve sprint m/s
            maxMomentumKnockback: 2.2,
            initialMomentum: 40,
            acceleration: 0.77,
            jumpKnockback: 0.7,
            jumpBoost: 3.6,
            invincible: false,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Spindash,
            exitSpindashMomentum: 40,
            stopBlockBreakingMomentum: 84,
            spindashDeceleration: 0.16,
            blockBreakForwardOffset: 1.0,
            verticalKnockbackRanks: [
                [0.0, 0.0],
                [0.1, 0.2],
                [0.2, 0.4],
                [0.3, 0.6],
                [0.4, 0.8],
                [0.5, 1.0],
            ],
            abilityTiers: [
                {
                    sneakTicks: 0,
                    momentum: 54,
                    forwardKnockback: 3,
                    bounceDamage: 20,
                },
                {
                    sneakTicks: 25,
                    momentum: 60,
                    forwardKnockback: 3.5,
                    bounceDamage: 37.5,
                },
                {
                    sneakTicks: 40,
                    momentum: 67,
                    forwardKnockback: 4,
                    bounceDamage: 60,
                },
                {
                    sneakTicks: 47,
                    momentum: 75,
                    forwardKnockback: 4.5,
                    bounceDamage: 70.5,
                },
                {
                    sneakTicks: 50,
                    momentum: 85,
                    forwardKnockback: 5.0,
                    bounceDamage: 75,
                },
            ],
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.Homing,
            nonHomingPushMomentum: 10,
            nonHomingPushHKnockback: 3,
            nonHomingPushVKnockback: 0.3,
            homingRayRange: 6.5,
            homingRayRadius: 5.0,
            homingPotentialTargetParticle: "gm1_ord:ring_sparkle",
            homingActiveTargetParticle: "chaos:ring_firework",
            homingKnockbackFar: 1.5,
            homingKnockbackClose: 1.25,
            homingCloseThreshold: 3.0,
            homingAcceleration: 1.75,
        },
        "gm1_ord:tails_life": {
            // General variables
            maxMomentum: 62,
            maxMomentumKnockback: 2.2,
            initialMomentum: 40,
            acceleration: 0.4,
            jumpKnockback: 0.7,
            jumpBoost: 4.5,
            invincible: false,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Spindash,
            exitSpindashMomentum: 40,
            stopBlockBreakingMomentum: 68.5,
            spindashDeceleration: 0.25,
            blockBreakForwardOffset: 1.2,
            verticalKnockbackRanks: [
                [0.0, 0.0],
                [0.1, 0.2],
                [0.2, 0.4],
                [0.3, 0.6],
                [0.4, 0.8],
                [0.5, 1.0],
            ],
            abilityTiers: [
                {
                    sneakTicks: 0,
                    momentum: 44,
                    forwardKnockback: 1.25,
                    bounceDamage: 20,
                },
                {
                    sneakTicks: 25,
                    momentum: 49,
                    forwardKnockback: 2.25,
                    bounceDamage: 37.5,
                },
                {
                    sneakTicks: 40,
                    momentum: 55,
                    forwardKnockback: 3.25,
                    bounceDamage: 60,
                },
                {
                    sneakTicks: 47,
                    momentum: 62.5,
                    forwardKnockback: 4.25,
                    bounceDamage: 70.5,
                },
                {
                    sneakTicks: 50,
                    momentum: 70,
                    forwardKnockback: 5,
                    bounceDamage: 75,
                },
            ],
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.Hover,
            hoverDuration: 2.5, // Seconds before only going down
            hoverUpCycleKnockback: 0.1,
            hoverDownCycleKnockback: 0.01, // Low positive or zero values like 0.01 or 0.0 will still make the character fall slowly
            hoverFallKnockbackSpeed: 0.00009, // Low positive or zero values like 0.01 or 0.0 will still make the character fall slowly
            hoverBoost: 0.2,
            hoverBoostTicks: 8,
            hoverCycleTime: 0.75, // Seconds each going up and down
            hoverMomentumCap: 40,
            hoverMomentumMin: 32,
        },
        "gm1_ord:knuckles_life": {
            // General variables
            maxMomentum: 67,
            maxMomentumKnockback: 2.2,
            initialMomentum: 40,
            acceleration: 0.65,
            jumpKnockback: 0.6,
            jumpBoost: 3.5,
            invincible: false,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Punch,
            exitPunchMomentum: 47,
            punchDeceleration: 3.8,
            impactNotificationTicks: 8,
            postPunchRunnableTicks: 20,
            blockBreakForwardOffset: 1,
            verticalKnockbackRanks: [0.0, 0.0, 0.4, 0.6, 0.8, 1.0],
            abilityTiers: [
                {
                    sneakTicks: 0,
                    momentum: 48,
                    damage: 20,
                    targetHKnockback: 0.5,
                    targetVKnockback: 0.5,
                    damageRadius: 4.0,
                    breaksBlocks: false,
                    punchEntityDetectionRadius: 4,
                    punchEntityForwardOffset: 1.25,
                },
                {
                    sneakTicks: 4,
                    momentum: 53,
                    damage: 20,
                    targetHKnockback: 0.75,
                    targetVKnockback: 0.5,
                    damageRadius: 5.0,
                    breaksBlocks: true,
                    punchEntityDetectionRadius: 5,
                    punchEntityForwardOffset: 1.75,
                },
                {
                    sneakTicks: 30,
                    momentum: 59,
                    damage: 45,
                    targetHKnockback: 1.0,
                    targetVKnockback: 0.5,
                    damageRadius: 6.0,
                    breaksBlocks: true,
                    punchEntityDetectionRadius: 6,
                    punchEntityForwardOffset: 2,
                },
                {
                    sneakTicks: 47,
                    momentum: 67,
                    damage: 70.5,
                    targetVKnockback: 0.5,
                    targetHKnockback: 1.25,
                    damageRadius: 7.0,
                    breaksBlocks: true,
                    punchEntityDetectionRadius: 7,
                    punchEntityForwardOffset: 3,
                },
                {
                    sneakTicks: 50,
                    momentum: 76,
                    damage: 75,
                    targetHKnockback: 1.5,
                    targetVKnockback: 0.5,
                    damageRadius: 8.0,
                    breaksBlocks: true,
                    punchEntityDetectionRadius: 8,
                    punchEntityForwardOffset: 4,
                },
            ],
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.Glide,
            glideDownKnockback: 0.015,
            glideAcceleration: 0.8,
            glideMomentumCap: 60,
            glideMomentumMin: 30,
        },
        "gm1_ord:amy_life": {
            // General variables
            maxMomentum: 67,
            maxMomentumKnockback: 2.2,
            initialMomentum: 40,
            acceleration: 0.55,
            jumpKnockback: 0.85,
            jumpBoost: 4,
            invincible: false,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Hammer,
            hammerFlyIntoEntityRange: 1.5,
            postHammerRunnableTicks: 20,
            impactNotificationTicks: 10,
            hammerVelocityMap: [-0.5, -3.0],
            hammerAOEMultiplierMap: [1.5, 2],
            verticalKnockbackRanks: [0.4, 0.7, 0.9, 1.1, 1.3, 1.5],
            abilityTiers: [
                {
                    sneakTicks: 0,
                    momentum: 48,
                    forwardKnockback: 3.0,
                    damage: 20,
                    radius: 5,
                    targetHKnockback: 2,
                    targetVKnockback: 0.5,
                },
                {
                    sneakTicks: 15,
                    momentum: 53,
                    forwardKnockback: 5.0,
                    damage: 22.5,
                    radius: 6,
                    targetHKnockback: 2.5,
                    targetVKnockback: 0.75,
                },
                {
                    sneakTicks: 30,
                    momentum: 59,
                    forwardKnockback: 4.5,
                    damage: 45,
                    radius: 7,
                    targetHKnockback: 3,
                    targetVKnockback: 1.0,
                },
                {
                    sneakTicks: 37,
                    momentum: 67,
                    forwardKnockback: 5.5,
                    damage: 55.5,
                    radius: 8,
                    targetHKnockback: 4,
                    targetVKnockback: 1.25,
                },
                {
                    sneakTicks: 45,
                    momentum: 76,
                    forwardKnockback: 6.5,
                    damage: 67.5,
                    radius: 10,
                    targetHKnockback: 5,
                    targetVKnockback: 1.5,
                },
            ],
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.DoubleJump,
            doubleJumpForceV: 1, // In whatever unit knockback uses
            doubleJumpCommTicks: 2,
            doubleJumpForwardKnockbackMult: 5,
            doubleJumpVKnockbackMult: 0.75,
        },
        "gm1_ord:shadow_life": {
            // General variables
            maxMomentum: 80,
            maxMomentumKnockback: 2.2,
            initialMomentum: 40,
            acceleration: 1.0,
            jumpKnockback: 0.8,
            jumpBoost: 3.8,
            invincible: false,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Dash,
            dashKnockback: 14, // In effect, determines how quickly the Dash is executed
            dashDelay: 2, // In ticks
            dashMinPitchForV: 20,
            blockBreakForwardOffset: 3,
            postDashVKnockback: 0.02, // Affected by dash direction, doesn't apply when looking straight ahead
            postDashRunnableTicks: 20,
            abilityTiers: [
                {
                    sneakTicks: 0,
                    momentum: 58,
                    maxDistance: 15,
                    killRadius: 4.25,
                    breaksBlocks: false,
                    dashSlowKillDamage: 20,
                },
                {
                    sneakTicks: 15,
                    momentum: 64,
                    maxDistance: 18,
                    killRadius: 5.25,
                    breaksBlocks: false,
                    dashSlowKillDamage: 22.5,
                },
                {
                    sneakTicks: 30,
                    momentum: 71,
                    maxDistance: 21,
                    killRadius: 6.25,
                    breaksBlocks: false,
                    dashSlowKillDamage: 45,
                },
                {
                    sneakTicks: 37,
                    momentum: 80,
                    maxDistance: 25,
                    killRadius: 7.25,
                    breaksBlocks: false,
                    dashSlowKillDamage: 55.5,
                },
                {
                    sneakTicks: 45,
                    momentum: 90,
                    maxDistance: 25,
                    killRadius: 8.25,
                    breaksBlocks: true,
                    dashSlowKillDamage: 67.5,
                },
            ],
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.Homing,
            nonHomingPushMomentum: 18,
            nonHomingPushHKnockback: 4,
            nonHomingPushVKnockback: 0.3,
            homingRayRange: 7,
            homingRayRadius: 6.5,
            homingPotentialTargetParticle: "gm1_ord:ring_sparkle",
            homingActiveTargetParticle: "chaos:ring_firework",
            homingKnockbackFar: 2.75,
            homingKnockbackClose: 0.5,
            homingCloseThreshold: 2.0,
            homingAcceleration: 2.0,
        },
        "gm1_ord:super_sonic_life": {
            // General variables
            maxMomentum: 90,
            maxMomentumKnockback: 2.35,
            initialMomentum: 42,
            acceleration: 1.15,
            jumpKnockback: 0.9,
            jumpBoost: 4.2,
            invincible: true,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Boost,
            boostGroundMomentum: 70,
            boostKillRadius: 6,
            blockBreakForwardOffset: 3.0,
            boostSlowKillDamage: 10,
            boostHoverAntiGravity: 0.043,
            boostDescentYKnockback: -0.05,
            multiHomingPause: 0,
            abilityTiers: [
                {
                    sneakTicks: 0,
                    forwardKnockback: 3,
                    upKnockback: 0.3,
                },
                {
                    sneakTicks: 10,
                    forwardKnockback: 4,
                    upKnockback: 0.5,
                },
                {
                    sneakTicks: 16,
                    forwardKnockback: 5,
                    upKnockback: 0.7,
                },
                {
                    sneakTicks: 20,
                    forwardKnockback: 6,
                    upKnockback: 0.8,
                },
                {
                    sneakTicks: 26,
                    forwardKnockback: 7,
                    upKnockback: 1.0,
                },
            ],
            // Boost flight variables
            flightKnockback: 2.25,
            flightKnockbackAntiGravity: 0.05,
            postFlightSlowFallTime: 4 * 20,
            postFlightSlowFallAmplifier: 1,
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.Homing,
            nonHomingPushMomentum: 20,
            nonHomingPushHKnockback: 8,
            nonHomingPushVKnockback: 0.6,
            homingRayRange: 15.0,
            homingRayRadius: 11.0,
            homingPotentialTargetParticle: "gm1_ord:ring_sparkle",
            homingActiveTargetParticle: "chaos:ring_firework",
            homingKnockbackFar: 3,
            homingKnockbackClose: 2.5,
            homingCloseThreshold: 6.0,
            homingAcceleration: 1.25,
            // Super Sonic ring magnet variables
            ringMagnetRange: 8.0,
            ringMagnetAcceleration: 0.08,
        },
        "gm1_ord:super_shadow_life": {
            // General variables
            maxMomentum: 90,
            maxMomentumKnockback: 2.38,
            initialMomentum: 42,
            acceleration: 1.15,
            jumpKnockback: 0.9,
            jumpBoost: 4.2,
            invincible: true,
            // Sneak ability variables
            sneakAbility: SneakAbilityTypes.Boost,
            boostGroundMomentum: 70,
            boostKillRadius: 6,
            blockBreakForwardOffset: 3.0,
            boostSlowKillDamage: 10,
            boostHoverAntiGravity: 0.043,
            boostDescentYKnockback: -0.05,
            multiHomingPause: 7,
            abilityTiers: [
                {
                    sneakTicks: 0,
                    forwardKnockback: 3,
                    upKnockback: 0.3,
                },
                {
                    sneakTicks: 10,
                    forwardKnockback: 4,
                    upKnockback: 0.5,
                },
                {
                    sneakTicks: 16,
                    forwardKnockback: 5,
                    upKnockback: 0.7,
                },
                {
                    sneakTicks: 20,
                    forwardKnockback: 6,
                    upKnockback: 0.8,
                },
                {
                    sneakTicks: 26,
                    forwardKnockback: 7,
                    upKnockback: 1.0,
                },
            ],
            // Boost flight variables
            flightKnockback: 3,
            flightKnockbackAntiGravity: 0.05,
            postFlightSlowFallTime: 4 * 20,
            postFlightSlowFallAmplifier: 1,
            // Jump ability variables
            jumpAbility: JumpAbilityTypes.Homing,
            nonHomingPushMomentum: 20,
            nonHomingPushHKnockback: 8,
            nonHomingPushVKnockback: 0.6,
            homingRayRange: 15.0,
            homingRayRadius: 11.0,
            homingPotentialTargetParticle: "gm1_ord:ring_sparkle",
            homingActiveTargetParticle: "chaos:ring_firework",
            homingKnockbackFar: 5,
            homingKnockbackClose: 2.5,
            homingCloseThreshold: 6.0,
            homingKnockbackAntiGravity: 0.05,
            homingAcceleration: 5.0,
            // Super Sonic ring magnet variables
            ringMagnetRange: 13.0,
            ringMagnetAcceleration: 0.1,
        },
    };
    //#endregion

    //#region Momentum variables
    static readonly MinMomentum = 20; // This is the player's ABSOLUTE minimum momentum, for all characters
    static readonly MaxMomentumRange = 79; // You can still set momentum higher than this, it's just the cap used in sprinting knockback calculations
    static readonly MinMomentumForSlabs = 40;
    static readonly SlabSideRaycastOffset = 75;
    static readonly SlabRaycastDistance = 8;
    static readonly ExtraSlabVerticalVelocity = -0.5;
    static readonly ExtraSlabLayers = 2;
    static readonly AxialKnockbackDeceleration = 0.2;
    static readonly MinRunDistPerTick = 0.2;
    static readonly SlowTicksBeforeMinMomentum = 2;

    // Running block breaking variables
    // runningBlockBreakRadius = 1 will check only the block at the player's feet
    // runningBlockBreakRadius = 2 will check a 3-block diameter square
    // runningBlockBreakRadius = 3 will check a 4-block diameter square, etc.
    // Increasingly higher values will exponentially decrease game performance
    static readonly RunningBlockBreakRadiusClose = 1.75;
    static readonly RunningBlockBreakRadiusFar = 2.25;
    static readonly RunningBreakForwardOffset = 1.75; // How many blocks in front of the player to put the block break square center
    static readonly RunningBlockBreakHeight = 3.25;
    static readonly RunningBreakYOffset = -1; // How many blocks below the player's feet to put the block break square center
    static readonly MinMomentumForBlockBreaking = 40;

    // "Water" running variables
    static readonly MinMomentumForLiquidRunning = 40;
    static readonly LiquidJumpLockTicks = 2;
    //#endregion

    //#region Jump and airtime variables
    static readonly BadnikBounceKnockback = 0.8;
    static readonly BadnikBounceYVelocityMultiplier = 0.25;
    static readonly SpecialBadnikBounceKnockback = new Map<string, number>([
        ["gm1_ord:badnik_eggrobo", 1.7],
        ["gm1_ord:eggman", 1.5],
    ]);
    static readonly BadnikBounceSpindashKnockback = 0.7;
    static readonly SpecialBadnikBounceSpindashKnockback = new Map<string, number>([
        ["gm1_ord:badnik_eggrobo", 1.7],
        ["gm1_ord:eggman", 1.5],
    ]);
    static readonly BadnikBounceDamage = 20;
    static readonly CoyoteTime = 10; // In ticks
    static readonly SneakSlowFall = 5;
    static readonly GroundAfterAbilityBufferTicks = 5;

    static readonly MaxFallKnockback = 10;
    static readonly FallAcceleration = 0.05;
    static readonly SneakFallKnockback = 0.01;
    static readonly JumpForwardKnockbackRange = [0.1, 2];
    //#endregion

    //#region Springs
    static readonly YellowSpringNoMomentumKnockback = 1.25;
    static readonly YellowSpringMomentumKnockback = 1.25;
    static readonly RedSpringNoMomentumKnockback = 1.7;
    static readonly RedSpringMomentumKnockback = 1.7;
    static readonly JumpPanelNoMomentumVKnockback = 0.75;
    static readonly JumpPanelMomentumVKnockback = 0.75;
    static readonly JumpPanelNoMomentumHKnockback = 3.0;
    static readonly JumpPanelMomentumHKnockback = 3.0;
    static readonly DashPanelNoMomentumKnockback = 4.0;
    static readonly DashPanelMomentumKnockback = 4.0;

    static readonly LevelFeatureSpringerTypes: Set<string> = new Set([
        "gm1_ord:lf_spring_yellow",
        "gm1_ord:lf_spring_red",
        "gm1_ord:lf_jump_panel",
        "gm1_ord:lf_dash_panel",
    ]);
    //#endregion

    //#region Health & Damage
    static readonly PostDamageInvulnerability = 2.5; // In seconds
    static readonly MaxDroppedRingStacks = 16;
    static readonly LiquidImpulseModifier = 3;
    static readonly RingHImpulseRange = [1.0, 1.75];
    static readonly RingVImpulseRange = [0.5, 0.75];
    static readonly DamageSourceImmunities = new Set<string>([
        EntityDamageCause.fire,
        EntityDamageCause.fireTick,
        EntityDamageCause.wither,
    ]);
    static readonly AlwaysTakeDamageFrom = new Set<string>([
        EntityDamageCause.blockExplosion,
        EntityDamageCause.entityExplosion,
        // Damage from script is classified as none, i.e. damage from spike blocks
        EntityDamageCause.none,
    ]);
    //#endregion

    //#region Transformation
    static readonly DetransformHungerDuration = 1.75; // In seconds
    static readonly DetransformHungerAmplifier = 255; // Probably best to leave this at 255
    static readonly DetransformHelmetDelay = 40; // In ticks
    static readonly WaterDetransformDelay = 3;
    static readonly DetransformInvisibilityDuration = 2;
    //#endregion

    //#region Chaos Emeralds
    // Caution: EmeraldPassThruBlocks should never include any solid blocks, leaves are solid blocks
    static readonly EmeraldPassThruBlocks = new Set<string>([
        "minecraft:air",
        "minecraft:tall_grass",
        "minecraft:short_grass",
        "minecraft:snow_layer",
        "minecraft:bamboo_sapling",
        "minecraft:oak_sapling",
        "minecraft:birch_sapling",
        "minecraft:jungle_sapling",
        "minecraft:dark_oak_sapling",
        "minecraft:spruce_sapling",
        "minecraft:acacia_sapling",
        "minecraft:cherry_sapling",
        "minecraft:mangrove_propagule",
        "minecraft:azalea",
        "minecraft:flowering_azalea",
        "minecraft:mangrove_roots",
        "minecraft:muddy_mangrove_roots",
        "minecraft:hanging_roots",
        "minecraft:short_grass",
        "minecraft:tall_grass",
        "minecraft:fern",
        "minecraft:deadbush",
        "minecraft:big_dripleaf",
        "minecraft:small_dripleaf_block",
        "minecraft:moss_carpet",
        "minecraft:vine",
        "minecraft:cave_vines",
        "minecraft:cave_vines_body_with_berries",
        "minecraft:cave_vines_head_with_berries",
        "minecraft:glow_lichen",
        "minecraft:brown_mushroom",
        "minecraft:red_mushroom",
        "minecraft:snow_layer",
        "minecraft:red_flower",
        "minecraft:allium",
        "minecraft:azure_bluet",
        "minecraft:blue_orchid",
        "minecraft:cornflower",
        "minecraft:lily_of_the_valley",
        "minecraft:oxeye_daisy",
        "minecraft:poppy",
        "minecraft:red_tulip",
        "minecraft:orange_tulip",
        "minecraft:white_tulip",
        "minecraft:pink_tulip",
        "minecraft:yellow_flower",
        "minecraft:dandelion",
        "minecraft:torchflower",
        "minecraft:torchflower_crop",
        "minecraft:pitcher_crop",
        "minecraft:wither_rose",
        "minecraft:closed_eyeblossom",
        "minecraft:open_eyeblossom",
        "minecraft:double_plant",
        "minecraft:large_fern",
        "minecraft:lilac",
        "minecraft:peony",
        "minecraft:pitcher_plant",
        "minecraft:rose_bush",
        "minecraft:sunflower",
        "minecraft:chorus_flower",
        "minecraft:chorus_plant",
        "minecraft:pink_petals",
        "minecraft:spore_blossom",
        "minecraft:sweet_berry_bush",
        "minecraft:waterlily",
    ]);

    static readonly EmeraldSpeedDownLastTickByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 20 * 2,
        "gm1_ord:chaos_emerald_blue": 20 * 2,
        "gm1_ord:chaos_emerald_red": 20 * 2,
        "gm1_ord:chaos_emerald_purple": 20 * 2,
        "gm1_ord:chaos_emerald_yellow": 20 * 2,
        "gm1_ord:chaos_emerald_white": 20 * 2,
        "gm1_ord:chaos_emerald_cyan": 20 * 2,
        "gm1_ord:chaos_emerald_gray": 20 * 2,
    };

    static readonly EmeraldDistanceForMaxSpeedByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 7,
        "gm1_ord:chaos_emerald_blue": 7,
        "gm1_ord:chaos_emerald_red": 7,
        "gm1_ord:chaos_emerald_purple": 6.5,
        "gm1_ord:chaos_emerald_yellow": 7,
        "gm1_ord:chaos_emerald_white": 6.5,
        "gm1_ord:chaos_emerald_cyan": 6.5,
        "gm1_ord:chaos_emerald_gray": 6.5,
    };

    static readonly EmeraldDistanceForMinSpeedByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 10,
        "gm1_ord:chaos_emerald_blue": 14,
        "gm1_ord:chaos_emerald_red": 12,
        "gm1_ord:chaos_emerald_purple": 14,
        "gm1_ord:chaos_emerald_yellow": 25,
        "gm1_ord:chaos_emerald_white": 16,
        "gm1_ord:chaos_emerald_cyan": 20,
        "gm1_ord:chaos_emerald_gray": 20,
    };

    static readonly EmeraldMinSpeedByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 0.45,
        "gm1_ord:chaos_emerald_blue": 0.5,
        "gm1_ord:chaos_emerald_red": 0.45,
        "gm1_ord:chaos_emerald_purple": 0.6,
        "gm1_ord:chaos_emerald_yellow": 0.65,
        "gm1_ord:chaos_emerald_white": 0.6,
        "gm1_ord:chaos_emerald_cyan": 0.7,
        "gm1_ord:chaos_emerald_gray": 0.7,
    };

    static readonly EmeraldMaxSpeedByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 6,
        "gm1_ord:chaos_emerald_blue": 6,
        "gm1_ord:chaos_emerald_red": 6,
        "gm1_ord:chaos_emerald_purple": 7,
        "gm1_ord:chaos_emerald_yellow": 6,
        "gm1_ord:chaos_emerald_white": 6.5,
        "gm1_ord:chaos_emerald_cyan": 7,
        "gm1_ord:chaos_emerald_gray": 7,
    };

    static readonly EmeraldFallEndThreshold = 0.8; // You technically can modify this but you probably shouldn't

    static readonly EmeraldMaxClimbHeightByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 3,
        "gm1_ord:chaos_emerald_blue": 3,
        "gm1_ord:chaos_emerald_red": 2,
        "gm1_ord:chaos_emerald_purple": 4,
        "gm1_ord:chaos_emerald_yellow": 3,
        "gm1_ord:chaos_emerald_white": 3,
        "gm1_ord:chaos_emerald_cyan": 4,
        "gm1_ord:chaos_emerald_gray": 3,
    };

    static readonly EmeraldChangeDirectionIntervalByColors: Record<string, [number, number]> = {
        "gm1_ord:chaos_emerald_green": [6 * 20, 10 * 20],
        "gm1_ord:chaos_emerald_blue": [5 * 20, 9 * 20],
        "gm1_ord:chaos_emerald_red": [7 * 20, 10 * 20],
        "gm1_ord:chaos_emerald_purple": [8 * 20, 8 * 20],
        "gm1_ord:chaos_emerald_yellow": [4 * 20, 7 * 20],
        "gm1_ord:chaos_emerald_white": [8 * 20, 8 * 20],
        "gm1_ord:chaos_emerald_cyan": [4 * 20, 6 * 20],
        "gm1_ord:chaos_emerald_gray": [3 * 20, 7 * 20],
    };

    static readonly EmeraldRingSpawnRateByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 14,
        "gm1_ord:chaos_emerald_blue": 14,
        "gm1_ord:chaos_emerald_red": 14,
        "gm1_ord:chaos_emerald_purple": 16,
        "gm1_ord:chaos_emerald_yellow": 16,
        "gm1_ord:chaos_emerald_white": 16,
        "gm1_ord:chaos_emerald_cyan": 14,
        "gm1_ord:chaos_emerald_gray": 17,
    };

    static readonly EmeraldTurnRangeRunningByColors: Record<string, [number, number]> = {
        "gm1_ord:chaos_emerald_green": [-90, 90],
        "gm1_ord:chaos_emerald_blue": [-80, 80],
        "gm1_ord:chaos_emerald_red": [-90, 90],
        "gm1_ord:chaos_emerald_purple": [-70, 70],
        "gm1_ord:chaos_emerald_yellow": [-70, 70],
        "gm1_ord:chaos_emerald_white": [-90, 90],
        "gm1_ord:chaos_emerald_cyan": [-80, 80],
        "gm1_ord:chaos_emerald_gray": [-70, 70],
    };

    static readonly EmeraldTurnRangeCollisionByColors: Record<string, [number, number, number, number]> = {
        "gm1_ord:chaos_emerald_green": [180 - 70, 180 - 45, 180 + 45, 180 + 70],
        "gm1_ord:chaos_emerald_blue": [180 - 70, 180 - 45, 180 + 45, 180 + 70],
        "gm1_ord:chaos_emerald_red": [180 - 90, 180 - 45, 180 + 45, 180 + 90],
        "gm1_ord:chaos_emerald_purple": [180 - 70, 180 - 45, 180 + 45, 180 + 70],
        "gm1_ord:chaos_emerald_yellow": [180 - 70, 180 - 45, 180 + 45, 180 + 70],
        "gm1_ord:chaos_emerald_white": [90, 90, 90, 90],
        "gm1_ord:chaos_emerald_cyan": [180 - 60, 180 - 45, 180 + 45, 180 + 60],
        "gm1_ord:chaos_emerald_gray": [180 - 70, 180 - 45, 180 + 45, 180 + 70],
    };

    static readonly EmeraldMinY = 62;

    static readonly EmeraldChaseDurationByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 25 * 20,
        "gm1_ord:chaos_emerald_blue": 30 * 20,
        "gm1_ord:chaos_emerald_red": 35 * 20,
        "gm1_ord:chaos_emerald_purple": 40 * 20,
        "gm1_ord:chaos_emerald_yellow": 45 * 20,
        "gm1_ord:chaos_emerald_white": 42 * 20,
        "gm1_ord:chaos_emerald_cyan": 50 * 20,
        "gm1_ord:chaos_emerald_gray": 35 * 20,
    };

    static readonly EmeraldFlashStartTime = 10; // start flashing when 10 sec left
    static readonly EmeraldFlashFrequency = 0.5; // flash every 0.5 sec

    static readonly EmeraldMaxChaseDistanceByColors: Record<string, number> = {
        "gm1_ord:chaos_emerald_green": 64,
        "gm1_ord:chaos_emerald_blue": 64,
        "gm1_ord:chaos_emerald_red": 64,
        "gm1_ord:chaos_emerald_purple": 64,
        "gm1_ord:chaos_emerald_yellow": 64,
        "gm1_ord:chaos_emerald_white": 64,
        "gm1_ord:chaos_emerald_cyan": 80,
        "gm1_ord:chaos_emerald_gray": 75,
    };

    static readonly EmeraldDirChangeQueryTicks = 2;
    static readonly EmeraldAvgSpeedTicks = 5;

    static readonly EmeraldCollectDistance = 2;
    static readonly EmeraldAutoCollectDistance = 64; // Auto-collect if player is outside this distance

    static readonly EmeraldStartupTime = 2 * 20;

    static readonly GrayEmeraldRingBurstCount = [16, 16];
    static readonly GrayEmeraldRingHImpulseRange = [0.5, 1];
    static readonly GrayEmeraldRingVImpulseRange = [0.5, 0.8];

    //#endregion

    //#region Shrines
    static readonly ShrineEggmanSpawnChance = 0.4;
    static readonly ShrineDeactivationDistance = 1000000000;
    static readonly ShrineEggroboCount = 4;
    static readonly ShrineEggroboAltitude = 3;
    static readonly ShrineEggroboRadius = 6;
    //#endregion

    //#region Chaos Machines
    static readonly CMDeactivationDistance = 9; // MAKE SURE this is 1 higher than initialization_range in the Crimson chaos_machine.json file
    //#endregion

    //#region Eggrobos
    static readonly RoboShootInterval = 6 * 20;
    static readonly RoboShootRange = 25;
    static readonly RoboShootOffset = new V3(-0.8, 1.0, 0.8);
    static readonly RoboProjectileSpeed = 0.65;
    static readonly RoboProjectileHitRadius = 1.1;
    static readonly RoboProjectileHitQueryYOffset = -1.0; // The design variable name is as ugly as the mechanic it represents
    static readonly RoboProjectileDamage = 10;
    static readonly RoboProjectileBlockDetectRange = 0.75;
    static readonly RoboAimYOffset = 1.3;
    //#endregion
}
