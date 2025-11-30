/* eslint-disable @typescript-eslint/naming-convention */
import { Message } from "Types/Message";
import Dragon, {
    AccelerationData,
    ExhaustionData,
    MilestoneData,
    PassiveTrustGainPerTickData,
    TrustGainActions,
    WantsData,
} from "./Dragon";

//#region Dragon Flight
export default class DefaultDragon extends Dragon {
    MaxSpeed = 2.2;
    BoostMaxSpeed = 3.7;
    Momentum = 0.7;

    TryToRideUnsaddledErrorMessage: Message = {
        translate: "gm1_zen.message.try_to_ride_unsaddled",
    };

    Acceleration(data: AccelerationData) {
        let value = 1; // default value
        value = value - data.directionChangePct; // The more you change direction, the less you accelerate
        value = MathUtil.clamp(value, 0, 2); // Clamp the value to 0-2
        value = value * 0.01; // Scale the value to 0-0.02
        if (data.isBoosting) value *= 10; // If boosting, increase the acceleration

        return value;
    }

    DecelerationFromExceedingMaxSpeed = 0.95;
    DecelerationFromMomentumChangeMultipler = 0.4;
    DecelerationFromMomentumChangeMinSpeed = 1;

    FovIntensity = 0.03;
    FovOffset = 0.0;
    MinFov = 0.02;
    MaxFov = 0.15;
    FovDecrementRate = 0.005;

    NoStaminaMaxSpeedMultiplier = 0.5;
    StaminaExhaustion: ExhaustionData = {
        flightTick: -0.05,
        boostingTick: -0.1,
        hoveringTick: -0.025,
        groundedTick: 0.15,
    };

    ActionbarData = {
        stamina: {
            barCharacter: "▌",
            amountPerBar: 5,
            remainingColor: "§a",
            remainingColorBoosting: "§b",
            lostColor: "§c",
        },
        trustPulse: {
            trustGainedIcon: "§u✴§r",
            trustLostIcon: "§c✴§r",
            pulseLength: 1,
        },
    };
    //#endregion

    //#region Attacks
    ProjectileId = "gm1_zen:nightfury_projectile";

    ProjectileSpawnLocationVerticalOffset = -2.2;
    ProjectileSpawnVerticalAngleOffset = 0;
    ProjectileScatter = 0;

    HuntingCooldown = 10 * 20;

    // MultipleProjectilesData: MultipleProjectilesData = {
    //     intervalBetweenShots: 5,
    //     shotCount: 5,
    //     scatter: 0,
    // };
    //#endregion

    //#region Wild Dragons
    CanFlyWhenWild = true;
    FlyingDurationRange = [5 * 20, 10 * 20];
    GroundedDurationRange = [16 * 20, 20 * 20];

    WildHoverDistanceToGround = 18;
    WildFlightDirectionChangeInterval = 3 * 20;
    WildHoverVerticalSpeed = 3.5;

    MeleeFlightAttackCooldown = 40;
    //#endregion

    //#region Sit Variables
    DragonScaleDropChance = 100;
    DragonScratchChance = 0.12;
    DragonScaleDropAmountRange: [number, number] = [1, 1];
    ScratchInterval = 3 * 20;

    SitToSleepDuration = 30 * 20;
    SleepDurationRange = [20 * 20, 120 * 20];

    SitDistance = 20;
    MobDetectRadius = 8;
    AfraidMobList = new Set(["minecraft:zombie", "minecraft:creeper"]);
    IsAttackedRefreshInterval = 20 * 5;
    IsAfraidMobNearbyRefreshInterval = 20 * 3;
    //#endregion

    //#region Trust Gain
    PassiveTrustGainPerTick(data: PassiveTrustGainPerTickData) {
        if (data.isBeingFlownTime > 5 * 20) return 0.025;

        if (data.passiveTrustPct > 0.3 && !MathUtil.isInRange(data.milestone.id, 0, 2)) return 0;

        if (data.hasPlayerTarget) return 0;

        if (MathUtil.isInRange(data.milestone.id, 0, 1) && data.distanceToNearestPlayer < 11) return 0.0;
        else if (MathUtil.isInRange(data.milestone.id, 3, 5) && data.distanceToNearestPlayer < 34 && data.trust < 38) return 0.0;
        else if (MathUtil.isInRange(data.milestone.id, 6, 8) && data.distanceToNearestPlayer < 34 && data.trust < 58) return 0.0;
        else if (MathUtil.isInRange(data.milestone.id, 9, 10) && data.distanceToNearestPlayer < 34) return 0.0;

        return 0;
    }

    TrustGainActions: TrustGainActions = {
        FeedWhenHungry: 5,
        FeedWhenWild: 5,
        FeedFavouriteFoodBonus: 5,
        DragonKillHostileMob: 10,
        PlayerKillHostileMob: 10,
        PetWhenPlayful: 15,
        HurtByPlayer: -5,
    };

    FoodData = GameData.FoodData.Fish;
    FavoriteFood = [] as string[];

    MilestoneToTriggerTameId = 3;
    MinimumMilestoneToGainTrustOnKill = 3;
    MinimumMilestoneToGainTrustOnPlayerKill = 3;

    PlayerKillHostileMobTrustGainMaxDistance = 16;
    DragonKillMobTrustGainMaxDistance = 16;

    Wants: WantsData = {
        saddle: {
            priority: "manual",
            duration: 30 * 20,
        },
        playful: {
            priority: 2,
            duration: 120 * 20,
            interval: [30 * 20, 180 * 20],
            minimumMilestoneId: 5,
        },
        hungry: {
            priority: 3,
            duration: 60 * 20,
            interval: [60 * 20, 120 * 20],
            minimumMilestoneId: 1,
        },
    };
    //#endregion

    //#region Trust Milestones
    Milestones: MilestoneData[] = [
        {
            name: "§c✪§r",
            id: 0,
            trustRange: [0, 5],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 0,
            canBeFed: true,
            speed: 0.15,
            projectileDamage: 0,
            resistanceMobEffect: 3,
        },
        {
            name: "§c✪§r",
            id: 1,
            trustRange: [5, 10],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 0,
            canBeFed: true,
            speed: 0.15,
            wantToTrigger: "hungry",
            projectileDamage: 0,
            resistanceMobEffect: 3,
        },
        {
            name: "§c✪§r",
            id: 2,
            trustRange: [10, 15],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 0,
            canBeFed: true,
            speed: 0.15,
            wantToTrigger: "hungry",
            projectileDamage: 0,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 3,
            trustRange: [15, 45],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 20,
            canBeFed: true,
            speed: 0.15,
            wantToTrigger: "saddle",
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 1,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 4,
            trustRange: [45, 75],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 25,
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 2,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 5,
            trustRange: [75, 120],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 30,
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 3,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 6,
            trustRange: [120, 170],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 35,
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 4,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 7,
            trustRange: [170, 245],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 40,
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 5,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 8,
            trustRange: [245, 320],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 45,
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 6,
            resistanceMobEffect: 3,
        },
        {
            name: "§2✪§r",
            id: 9,
            trustRange: [320, 395],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: 50,
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 7,
            resistanceMobEffect: 3,
        },
        {
            name: "§u✪§r",
            id: 10,
            trustRange: [395, 485],
            accelerationMultiplier: 1.0,
            maxSpeedMultiplier: 1.0,
            boostMaxSpeedMultiplier: 1.0,
            maxStamina: "infinite",
            canBeFed: true,
            speed: 0.15,
            projectileAttackCooldown: 1 * 20,
            projectileDamage: 8,
            resistanceMobEffect: 3,
        },
    ];

    MilestoneUpdateMessage(milestone: MilestoneData): Message | null {
        return null;

        const nameTag = this.entityF.nameTag;
        const displayName = nameTag ? ` ${nameTag}` : "";
        return [
            { translate: "gm1_zen.message.milestone_update_part1" },
            { translate: `entity.${this.entityF.typeId}.name` },
            { text: `${displayName}` },
            { translate: "gm1_zen.message.milestone_update_part2", with: [milestone.name] },
        ];
    }
    //#endregion
}
