import { Entity } from "@minecraft/server";
import DefaultDragon from "./DefaultDragon";
import { MilestoneData } from "./Dragon";

export default class Gronckle extends DefaultDragon {
    static readonly EntityTypes = ["gm1_zen:gronckle"];

    //#region Flight
    MaxSpeed = 0.5;
    BoostMaxSpeed = 0.65;
    Momentum = 0.3;

    FovIntensity = 0.03;
    FovOffset = 0.0;
    MinFov = 0.05;
    FovDecrementRate = 0.005;

    DecelerationFromExceedingMaxSpeed = 0.01;
    DecelerationFromMomentumChangeMultipler = 2;
    DecelerationFromMomentumChangeMinSpeed = 0.5;

    NoStaminaMaxSpeedMultiplier = 1;
    //#endregion

    //#region Projectile
    ProjectileId = "gm1_zen:gronckle_projectile";
    ProjectileSpawnLocationVerticalOffset = -2.2;
    ProjectileSpawnVerticalAngleOffset = 1.6;
    ProjectileAttackCooldown = 0;
    //#endregion

    //#region Food
    FoodData = GameData.FoodData.Rock;

    FavoriteFood = [
        "minecraft:cobblestone", //
    ];
    //#endregion

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
            speed: 0.1,
            projectileDamage: 0,
            resistanceMobEffect: 3,
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
            speed: 0.1,
            wantToTrigger: "hungry",
            projectileDamage: 0,
            resistanceMobEffect: 3,
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
            speed: 0.1,
            wantToTrigger: "hungry",
            projectileDamage: 0,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 3,
            trustRange: [15, 25],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 20,
            canBeFed: true,
            speed: 0.1,
            wantToTrigger: "saddle",
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 6,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 4,
            trustRange: [25, 40],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 25,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 6,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 5,
            trustRange: [40, 70],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 30,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 8,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 6,
            trustRange: [70, 115],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 35,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 8,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 7,
            trustRange: [115, 210],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 40,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 8,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 8,
            trustRange: [210, 400],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 45,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 10,
            resistanceMobEffect: 3,
        },
        {
            name: "§g✴§r",
            id: 9,
            trustRange: [400, 590],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 50,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 10,
            resistanceMobEffect: 3,
        },
        {
            name: "§u✴§r",
            id: 10,
            trustRange: [590, 600],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 70,
            canBeFed: true,
            speed: 0.1,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 12,
            resistanceMobEffect: 3,
        },
    ];
    //#endregion

    constructor(entity: Entity) {
        super(entity);
        this.init();
    }
}
