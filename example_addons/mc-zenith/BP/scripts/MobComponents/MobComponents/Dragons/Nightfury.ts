import { Entity, world } from "@minecraft/server";
import DragonPersistentData from "Dragon/DragonPersistentData";
import DefaultDragon from "./DefaultDragon";
import { MilestoneData, MultipleProjectilesData } from "./Dragon";

export default class Nightfury extends DefaultDragon {
    static readonly EntityTypes = ["gm1_zen:nightfury"];

    //#region Flight
    CanFlyWhenWild = false;

    MaxSpeed = 1.8;
    BoostMaxSpeed = 2;
    Momentum = 0.7;

    FovIntensity = 0.03;
    FovOffset = 0.0;
    MinFov = 0.02;
    MaxFov = 0.15;
    FovDecrementRate = 0.005;

    DecelerationFromExceedingMaxSpeed = 0.95;
    DecelerationFromMomentumChangeMultipler = 0.4;
    DecelerationFromMomentumChangeMinSpeed = 1;

    NoStaminaMaxSpeedMultiplier = 0.5;
    //#endregion

    ProjectileId = "gm1_zen:nightfury_projectile";
    ProjectileSpawnLocationVerticalOffset = -3.2;
    ProjectileAttackCooldown = 0.5 * 20;
    MultipleProjectilesData: MultipleProjectilesData = {
        shotCount: 5,
        intervalBetweenShots: 5,
    };

    FoodData = { ...GameData.FoodData.Fish, ...GameData.FoodData.Meat };

    FavoriteFood = [
        "minecraft:tropical_fish", //
    ];

    //#region Trust Milestones
    Milestones: MilestoneData[] = [
        {
            name: "§c✴§r",
            id: 0,
            trustRange: [0, 5],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 0,
            canBeFed: true,
            speed: 0.22,
            projectileDamage: 0,
            resistanceMobEffect: 0,
        },
        {
            name: "§c✴§r",
            id: 1,
            trustRange: [5, 10],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 0,
            canBeFed: true,
            speed: 0.22,
            wantToTrigger: "hungry",
            projectileDamage: 0,
            resistanceMobEffect: 0,
        },
        {
            name: "§c✴§r",
            id: 2,
            trustRange: [10, 15],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 0,
            canBeFed: true,
            speed: 0.22,
            wantToTrigger: "hungry",
            projectileDamage: 0,
            resistanceMobEffect: 0,
        },
        {
            name: "§g✴§r",
            id: 3,
            trustRange: [15, 45],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 20,
            canBeFed: true,
            speed: 0.22,
            wantToTrigger: "saddle",
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 2,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 4,
            trustRange: [45, 75],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 25,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 2,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 5,
            trustRange: [75, 120],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 30,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 3,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 6,
            trustRange: [120, 170],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 35,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 3,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 7,
            trustRange: [170, 245],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 40,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 3,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 8,
            trustRange: [245, 320],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 45,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 4,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 9,
            trustRange: [320, 395],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 50,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 4,
            resistanceMobEffect: 3,
        },
        {
            name: "§u✴§r",
            id: 10,
            trustRange: [395, 485],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 70,
            canBeFed: true,
            speed: 0.22,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 4,
            resistanceMobEffect: 3,
        },
    ];
    //#endregion

    constructor(entity: Entity) {
        super(entity);
        if (Config.get("Debug: Only 1 Nightfury") && DragonPersistentData.nightfuryExists(this.entityId)) {
            entity.remove();
            world.sendMessage({ translate: "gm1_zen.message.nightfuryspawnerror" });
            return;
        }

        this.init();
    }
}
