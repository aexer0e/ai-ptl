/* eslint-disable @typescript-eslint/naming-convention */
import {
    DataDrivenEntityTriggerAfterEvent,
    Entity,
    EntityHealthComponent,
    EntityRideableComponent,
    EntityTameableComponent,
    ItemStack,
    Player,
    system,
} from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import DragonPersistentData from "Dragon/DragonPersistentData";
import DragonFlightSystem from "Dragon/DragonSystems/DragonFlightSystem";
import DragonTameSystem from "Dragon/DragonSystems/DragonTameSystem";
import DragonTrustSystem from "Dragon/DragonSystems/DragonTrustSystem";
import DragonWantsSystem from "Dragon/DragonSystems/DragonWantsSystem";
import DragonWildSystem from "Dragon/DragonSystems/DragonWildSystem";
import { FoodDataEntry } from "Game/GameData";
import { Message } from "Types/Message";
import V3 from "Wrappers/V3";
import MobComponent from "../MobComponent";

export interface PassiveTrustGainPerTickData {
    /** Distance to the nearest player */
    distanceToNearestPlayer: number;
    /** Current trust value of the dragon */
    trust: number;
    /** Current milestone of the dragon */
    milestone: MilestoneData;
    /** Whether the dragon is being flown by a player */
    isBeingFlown: boolean;
    /** The duration in ticks that the dragon has been consecutively flown by the player */
    isBeingFlownTime: number;
    /** Whether the dragon has a player target */
    hasPlayerTarget: boolean;
    /** What percentage (0-1) of this milestone's trust has been accured from passive trust */
    passiveTrustPct: number;
}

export interface AccelerationData {
    /** How much the dragon has changed direction in the last few ticks from 0-1 */
    directionChangePct: number;
    /** Whether the dragon is boosting */
    isBoosting: boolean;
}

export interface TrustGainActions {
    /** Amount of trust gained when the player pets the dragon when it's playful */
    PetWhenPlayful: number;
    /** Amount of trust gained when feeding the dragon when it's hungry */
    FeedWhenHungry: number;
    /** Amount of trust gained when feeding the dragon when it's wild */
    FeedWhenWild: number;
    /** Amount added during feeding if it's the dragon's favorite food */
    FeedFavouriteFoodBonus: number;
    /** Amount of trust gained when your dragon kills a hostile mob near you */
    DragonKillHostileMob: number;
    /** Amount of trust gained when the player kills a hostile mob near the dragon */
    PlayerKillHostileMob: number;
    /** Amount of trust gained/lost (negative for lost) when the dragon is hurt by thr player.
    This value is automatically capped to the current milestone's minimum trust, so this will
    not make the dragon lose a milestone */
    HurtByPlayer: number;
}

export interface MilestoneData {
    /** The name of the milestone */
    name: string;
    /** The ID of the milestone. Must match the index of this milestone in the Milestones array */
    id: number;
    /** The trust range for the milestone, if the trust is between this range this milestone will be selected */
    trustRange: number[];
    /** The acceleration multiplier for the milestone */
    accelerationMultiplier: number;
    /** The max speed multiplier for the milestone */
    maxSpeedMultiplier: number;
    /** The boost max speed multiplier for the milestone */
    boostMaxSpeedMultiplier: number;
    /** Whether the dragon can be fed by the player */
    canBeFed: boolean;
    /** Max stamina. Accepts either a number or "infinite" */
    maxStamina: number | "infinite";
    /** The ground movement speed of the dragon to set the minecraft:movement component value to */
    speed: number;
    /** The amplifier of the resistance mob effect to apply to the dragon. Leave undefined to not apply any resistance. goes in increments of 20%, starting at 0. (0 = 20%, 4 = 100% resistance) */
    resistanceMobEffect?: number;
    /** The want to trigger when the dragon reaches this milestone */
    wantToTrigger?: keyof WantsData;
    /** The cooldown time for the dragon to attack with the projectile again */
    projectileAttackCooldown?: number;
    /** Override the damage of the projectile this dragon shoots */
    projectileDamage: number;
}

export interface WantsEntryDataInterval {
    /** The milestone ID that unlocks this want */
    minimumMilestoneId: number;
    /** The min/max duration range to wait before having this want again */
    interval: [number, number];
    /** The duration of the want before it's gone */
    duration: number;
    /** The priority of this want. The lower the value the higher the priority. */
    priority: number;
}

export interface WantsEntryDataManual {
    priority: "manual";
    /** The duration of the want before it's gone */
    duration: number;
}

export interface ExhaustionData {
    /** The amount to add/remove to stamina when flying per tick */
    flightTick: number;
    /** The amount to add/remove to stamina when boosting per tick, is added to flightTick */
    boostingTick: number;
    /** The amount to add/remove to stamina when hovering per tick */
    hoveringTick: number;
    /** The amount to add/remove to stamina when grounded per tick */
    groundedTick: number;
}

export interface MultipleProjectilesData {
    /** Number of shots to fire. */
    shotCount: number;

    /** Time between shots in ticks. */
    intervalBetweenShots: number;
}

export type WantsEntryData = WantsEntryDataInterval | WantsEntryDataManual;

export interface WantsData {
    hungry: WantsEntryDataInterval;
    playful: WantsEntryDataInterval;
    saddle: WantsEntryDataManual;
}

export default abstract class Dragon extends MobComponent {
    /** The maximum speed of the dragon in flight mode */
    abstract MaxSpeed: number;

    /** The maximum speed of the dragon in flight mode when boosting */
    abstract BoostMaxSpeed: number;

    /** The momentum of the dragon: The higher the value, the more the dragon drifts when changing direction. Sweet spot range: 0.7-0.9 */
    abstract Momentum: number;

    /** The distance to the ground when flying in wild state */
    abstract WildHoverDistanceToGround: number;

    /** The vertical speed of the dragon when flying in wild state */
    abstract WildHoverVerticalSpeed: number;

    /** The interval in ticks to change the flight direction when flying in wild state */
    abstract WildFlightDirectionChangeInterval: number;

    /** The value to add to the current speed while flying every tick. 0: No change to speed, 0+: Accelerate; 0-: Decelerate */
    abstract Acceleration(data: AccelerationData): number;

    /** The value to multiply the speed by when exceeding the max speed. 1: No deceleration, 1-: Decelerate */
    abstract DecelerationFromExceedingMaxSpeed: number;

    /** The multiplier of deceleration from momentum change. 0: No deceleration, 0+: Deceleration from momentum change */
    abstract DecelerationFromMomentumChangeMultipler: number;

    /** The minimum speed to decelerate from momentum change. 0: No deceleration, 0+: Deceleration from momentum change */
    abstract DecelerationFromMomentumChangeMinSpeed: number;

    /** The multiplier of max speed when the dragon has no stamina. 1: No change to max speed */
    abstract NoStaminaMaxSpeedMultiplier: number;

    /** The amount of stamina points to add/remove per tick. To remove stamina, it has to be a negative number like -0.1, while a positive number like 0.1 would add it. To convert to a rate of seconds, do "time in seconds/20" to get the right stamina point amount. */
    abstract StaminaExhaustion: ExhaustionData;

    /** Actionbar data */
    abstract ActionbarData: {
        stamina: {
            /** The character to use for a stamina bar */
            barCharacter: string;
            /** The amount of stamina to fill one bar character */
            amountPerBar: number;
            /** The color of the remaining stamina bar characters */
            remainingColor: string;
            /** The color of the remaining stamina bar characters when boosting */
            remainingColorBoosting: string;
            /** The color of the lost stamina bar characters */
            lostColor: string;
        };
        trustPulse: {
            /**This temporarily changes the milestone icon on trust gained */
            trustGainedIcon: string;
            /**This temporarily changes the milestone icon on trust lost */
            trustLostIcon: string;
            /**This variable changes how long the pulse lasts for in seconds*/
            pulseLength: number;
        };
    };

    /** How much the FOV should change per speed unit. 0: No change to FOV, 0+: Increase FOV */
    abstract FovIntensity: number;

    /** The offset to add to the FOV. 0: No change to base FOV, 0+: Increased base FOV, 0-: Decreased base FOV */
    abstract FovOffset: number;

    /** The minimum FOV cap. */
    abstract MinFov: number;

    /** The maximum FOV cap. */
    abstract MaxFov: number;

    /** The FOV decrementation rate after exiting a boost */
    abstract FovDecrementRate: number;

    /** Whether this dragon can fly when wild */
    abstract CanFlyWhenWild: boolean;

    /** Duration for wild state to stay in flight mode before landing */
    abstract FlyingDurationRange: number[];

    /** Duration for wild state to stay in grounded mode before flying again */
    abstract GroundedDurationRange: number[];

    /** Duration for the dragon to sit before going to sleep */
    abstract SitToSleepDuration: number;

    /** Duration for the dragon to sleep before waking up */
    abstract SleepDurationRange: number[];

    /** The cooldown time for wild melee attacking while flying */
    abstract MeleeFlightAttackCooldown: number;

    /** Entries of each milestone and their properties */
    abstract Milestones: MilestoneData[];

    /** The milestone ID that will trigger the dragon to be tamed */
    abstract MilestoneToTriggerTameId: number;

    /** The minimum milestone that the dragon will gain trust when it kills a hostile mob near you  */
    abstract MinimumMilestoneToGainTrustOnKill: number;

    /** The minimum milestone that the dragon will gain trust when you kill a hostile mob near it */
    abstract MinimumMilestoneToGainTrustOnPlayerKill: number;

    /** The maximum distance from the dragon to the player to gain trust when the player kills a hostile mob */
    abstract PlayerKillHostileMobTrustGainMaxDistance: number;

    /** The maximum distance from the dragon to the player to gain trust when the dragon kills a hostile mob */
    abstract DragonKillMobTrustGainMaxDistance: number;

    /** The message to send when the dragon's milestone is updated */
    abstract MilestoneUpdateMessage(milestone: MilestoneData): Message | null;

    /** The message to send when the player tries to ride the dragon without a saddle */
    abstract TryToRideUnsaddledErrorMessage: Message;

    /** The value added to or subtracted from the trust value every tick */
    abstract PassiveTrustGainPerTick(data: PassiveTrustGainPerTickData): number;

    /** How much trust is gained or removed from an action occuring */
    abstract TrustGainActions: TrustGainActions;

    abstract Wants: WantsData;

    /** The cooldown time to wait before hunting passive mobs after it has killed a mob */
    abstract HuntingCooldown: number;

    /** The ID of the projectile to shoot */
    abstract ProjectileId: string;

    /** The vertical offset of the projectile spawn location from the player head's location */
    abstract ProjectileSpawnLocationVerticalOffset: number;

    /** The vertical offset of the projectile shooting angle from the player head's location */
    abstract ProjectileSpawnVerticalAngleOffset: number;

    /** Whether to shoot multiple projectiles or not, Leave empty if you want to shoot only one projectile */
    MultipleProjectilesData?: MultipleProjectilesData;

    /** The accuracy of the projectile. 0: No scatter, 0+: Scatter */
    abstract ProjectileScatter: number;

    /** the chance that dragon are able to drop scale, range: 0-1 */
    abstract DragonScaleDropChance: number;

    /** Chance that a dragon scratches itself when the scratch interval triggers, range: 0-1 */
    abstract DragonScratchChance: number;

    /** Range of how many scales to drop when triggered */
    abstract DragonScaleDropAmountRange: [number, number];

    /** Food that gives bonus trust when fed */
    abstract FavoriteFood: string[];

    /** Defines the edible food for this dragon */
    abstract FoodData: Record<string, FoodDataEntry>;

    /** If player leave far away from dragon over the distance, dragon will sit */
    abstract SitDistance: number;

    /** If afraid mob close to dragon in this radius, sit dragon will unsit */
    abstract MobDetectRadius: number;

    /** Afraid mob list which make dragon unsit */
    abstract AfraidMobList: Set<string>;

    /** Every ScratchInterval ticks Dragon will try to scratch if it is sitting not sleeping */
    abstract ScratchInterval: number;

    /** Cooldown for the dragon to resume previous activity after the dragon has been attacked */
    abstract IsAttackedRefreshInterval: number;

    /** Cooldown for the dragon to resume previous activity after mob has left range */
    abstract IsAfraidMobNearbyRefreshInterval: number;

    rider: Player | undefined;
    propCache = {
        rest_state: null as "none" | "sitting" | "sleeping" | "scratching" | null,
        is_boosting: null as boolean | null,
        is_fly_attacking: null as boolean | null,
        is_flying_on_own: null as boolean | null,
        is_flying: null as boolean | null,
        is_hovering: null as boolean | null,
        is_ranged_attacking: null as boolean | null,
        flight_state: null as "flying" | "hovering" | "grounded" | null,
        milestone: null as number | null,
        trust_increase: null as number | null,
        want: null as
            | "none"
            | "hungry"
            | "playful"
            | "hungry_success"
            | "hungry_success_favorite"
            | "playful_success"
            | "saddle"
            | "saddle_success"
            | null,
    };

    target: Entity | undefined;

    logData: string[] = [];
    logTick = 0;

    dragonScaleDropTick: number = 0;

    attackedTick = 0;
    afraidMobNearbyTick = 0;
    removeHuntingCooldownTagRunnerId: number | undefined = undefined;

    wantsSystem = new DragonWantsSystem(this);
    flightSystem = new DragonFlightSystem(this);
    wildSystem = new DragonWildSystem(this);
    tameSystem = new DragonTameSystem(this);
    trustSystem = new DragonTrustSystem(this);

    constructor(entity: Entity) {
        super(entity, 1);
    }

    init() {
        const persistentDragonId = this.getPersistentProperty("PersistentDragonId");
        if (persistentDragonId !== -1) {
            const dragonPersistentData = DragonPersistentData.getPersistentData(persistentDragonId);
            const version = this.getPersistentProperty("EntityVersion");
            if (dragonPersistentData?.version !== version) {
                return this.entityF.remove();
            }
        }

        this.wildSystem.init();
        this.wantsSystem.init();
        this.trustSystem.init();
        this.flightSystem.init();

        // this.entityF.triggerEvent("gm1_zen:reset_target");
        this.entityF.removeTag("gm1_zen:on_hunting_cooldown");

        if (!this.getPersistentProperty("IsInitialized")) {
            if (this.tameSystem.isTamed()) {
                this.entityF.triggerEvent(`gm1_zen:milestone_${this.milestone.id}.add`);
            }
            this.setPersistentProperty("IsInitialized", true);
        }

        this.onWorldEvent("WorldAfterEvents", "entityDie", (eventData) => {
            const killer = eventData.damageSource.damagingEntity;

            const dragonDied = eventData.deadEntity.id === this.entityId;
            if (dragonDied && this.entity.valid()) {
                this.onDeath();
                return;
            }

            const dragonKilledMob = killer?.id === this.entityId;
            if (dragonKilledMob && this.entity.valid()) {
                this.onKillMob(eventData.deadEntity);
                return;
            }

            const playerKilledMob = killer?.typeId === "minecraft:player";
            if (playerKilledMob && this.entity.valid()) {
                this.onPlayerKilledEntity(killer as Player, eventData.deadEntity);
                return;
            }
        });

        this.onWorldEvent("WorldBeforeEvents", "playerInteractWithEntity", (eventData) => {
            if (eventData.target.id !== this.entityId) return;
            this.timeout(() => {
                const player = eventData.player;
                this.onPlayerInteractedWith(player);
            }, 0);
        });

        this.onWorldEvent("WorldAfterEvents", "dataDrivenEntityTrigger", (eventData) => this.onEvent(eventData));

        this.onWorldEvent("WorldAfterEvents", "entityHurt", (eventData) => {
            if (eventData.hurtEntity.id == this.entityId) {
                this.attackedTick = Main.currentTick;

                const attackedByPlayer = eventData.damageSource.damagingEntity?.typeId === "minecraft:player";
                if (attackedByPlayer) {
                    this.trustSystem.addTrust(this.TrustGainActions.HurtByPlayer, false, true);
                }
            }
        });
    }

    process() {
        if (!EntityUtil.isAlive(this.entity)) return this.flightSystem.tryEndFlight();

        this.checkAfraidMobNearby();

        if (this.tameSystem.isTamed()) this.tameSystem.process();
        else this.wildSystem.process();

        this.wantsSystem.processWants();

        this.trustSystem.process();

        if (Config.get("Debug: Nearest Dragon Data in Actionbar")) {
            this.logValues();
        }
    }

    onDeath() {
        // lose 1 milestone unless last milestone is below MilestoneToTriggerTameId
        const lastMilestoneId = this.milestone.id - 1;
        const lastMilestone = this.Milestones.find((m) => m.id === lastMilestoneId);

        const isLastMilestoneWild = lastMilestoneId < this.MilestoneToTriggerTameId;
        // console.warn(
        //     `Dragon ${this.entityId} died. Current milestone: ${this.milestone.id}. Last milestone: ${lastMilestoneId} (Wild: ${isLastMilestoneWild})`
        // );
        const player = this.entityF.getComponent(EntityTameableComponent.componentId) as EntityTameableComponent;
        if (player.tamedToPlayer != undefined) {
            const dragonName = this.entityF.nameTag;
            if (!dragonName) {
                player.tamedToPlayer.sendMessage([
                    { translate: "gm1_zen.message.tamedDragonDeath1" },
                    { translate: `entity.${this.entityF.typeId}.name` },
                    { translate: "gm1_zen.message.tamedDragonDeath2", with: [dragonName] },
                ]);
            } else {
                player.tamedToPlayer.sendMessage({ translate: "gm1_zen.message.tamedDragonDeath2", with: [dragonName] });
            }
        }
        if (isLastMilestoneWild) return;

        const minTrustLastMilestone = lastMilestone!.trustRange[0];
        // console.warn(`Dragon ${this.entityId} lost a milestone. New trust: ${minTrustLastMilestone}. New milestone: ${lastMilestoneId}`);
        DragonPersistentData.updatePersistentData(this.entityId, { trust: minTrustLastMilestone + 0.01, deathTick: system.currentTick });
    }

    onPlayerKilledEntity(player: Player, deadEntity: Entity) {
        if (this.milestone.id >= this.MinimumMilestoneToGainTrustOnPlayerKill) {
            const isPlayerNearby = V3.distance(this.entityF.location, player.location) < this.PlayerKillHostileMobTrustGainMaxDistance;
            // console.warn(`Player ${player.name} killed entity ${deadEntity.id}. Is player nearby: ${isPlayerNearby}`);
            if (!isPlayerNearby) return;

            const deadEntityWasHostile = EntityUtil.entityFamilyIsInSet(deadEntity, GameData.HostileEntityFamilies);
            // console.warn(`Entity ${deadEntity.id} was hostile: ${deadEntityWasHostile}`);
            if (!deadEntityWasHostile) return;

            const trustGain = this.TrustGainActions.PlayerKillHostileMob;
            this.trustSystem.addTrust(trustGain);
        }
    }

    onKillMob(_mob: Entity) {
        if (this.milestone.id >= this.MinimumMilestoneToGainTrustOnKill) {
            const isPlayerNearby = EntityUtil.getNearbyPlayersAtDimLoc(this.DragonKillMobTrustGainMaxDistance, this.entityF).length > 0;
            if (isPlayerNearby) {
                const trustGain = this.TrustGainActions.DragonKillHostileMob;
                this.trustSystem.addTrust(trustGain);
            }
        }

        this.entityF.addTag("gm1_zen:on_hunting_cooldown");
        if (typeof this.removeHuntingCooldownTagRunnerId == "number") system.clearRun(this.removeHuntingCooldownTagRunnerId);
        this.removeHuntingCooldownTagRunnerId = this.timeout(() => {
            this.entityF.removeTag("gm1_zen:on_hunting_cooldown");
        }, this.HuntingCooldown);
    }

    onIsAvoidingMobs() {
        if (this.tameSystem.isTamed()) return;
        this.entityF.addEffect("speed", 3 * 20, {
            amplifier: 2,
            showParticles: false,
        });
        if (this.CanFlyWhenWild) this.wildSystem.ensureIsFlying();
    }

    isAfraidMobNearby() {
        return this.timeSince(this.afraidMobNearbyTick) < this.IsAfraidMobNearbyRefreshInterval;
    }

    isAttacked() {
        return this.timeSince(this.attackedTick) < this.IsAttackedRefreshInterval;
    }

    checkAfraidMobNearby(): boolean {
        const mobList = this.AfraidMobList;
        const dragon = this.entityF;
        const dimension = dragon.dimension;

        const nearby = dimension.getEntities({
            location: dragon.location,
            maxDistance: this.MobDetectRadius,
        });
        const isNearby = nearby.some((e) => mobList.has(e.typeId));
        if (isNearby) {
            this.afraidMobNearbyTick = Main.currentTick;
        }

        return isNearby;
    }

    onEvent(eventData: DataDrivenEntityTriggerAfterEvent) {
        if (eventData.eventId !== "gm1_zen:has_no_rider") return;
        if (this.entityId !== eventData.entity.id) {
            return;
        } else if (eventData.eventId == "gm1_zen:has_no_rider") {
            this.flightSystem.disable();
        }
    }

    onPlayerInteractedWith(player: Player) {
        const selectedItem = InventoryUtil.selectedItem(player);

        if (selectedItem?.typeId === "gm1_common:debug_controller") {
            const form = new ModalFormData()
                .title("Dragon Debug Controller")
                .textField("Trust (0 - 1000)", `${this.getPersistentProperty("Trust")}`)
                .slider("Milestone (for display)", 0, this.Milestones.length - 1, 1, this.milestone.id)
                .submitButton("Apply");

            form.show(player).then((response) => {
                if (response.canceled) return;

                const trustText = response.formValues?.[0] as string;
                const trustValue = Math.max(0, Math.min(1000, parseInt(trustText)));
                if (isNaN(trustValue)) return;

                const currentTrust = this.getPersistentProperty("Trust");
                const trustChange = trustValue - currentTrust;
                this.trustSystem.addTrust(trustChange);
            });
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Player ${player.name} opened debug controller. Trust: ${this.getPersistentProperty("Trust")}`
            );
            return;
        }

        if (selectedItem?.typeId === "gm1_zen:dragon_saddle") {
            const isSaddled = this.entityF.getProperty("gm1_zen:is_saddled") as boolean;
            if (!isSaddled && this.milestone.id >= this.MilestoneToTriggerTameId) {
                this.entityF.setProperty("gm1_zen:is_saddled", true);
                DragonPersistentData.updatePersistentData(this.entityId, { isSaddled: true });
                InventoryUtil.clearItem(player, selectedItem);
                if (this.wantsSystem.currentWant?.key === "saddle") {
                    this.wantsSystem.finishWant();
                }
                if (this.entityF.typeId == "gm1_zen:nightfury") return;
                this.wantsSystem.promptToName(player);

                return;
            }
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Player ${player.name} tried to saddle dragon ${this.entityId}. Is saddled: ${isSaddled}`
            );
            return;
        }

        // interact with dragon holding dye
        if (this.tameSystem.isTamed()) {
            if (selectedItem?.typeId === GameData.DragonArmorItemTypeId) {
                const hasArmor = this.entityF.getProperty("gm1_zen:has_armor") as boolean;
                if (!hasArmor && this.milestone.id >= this.MilestoneToTriggerTameId) {
                    this.entityF.setProperty("gm1_zen:has_armor", true);
                    DragonPersistentData.updatePersistentData(this.entityId, { hasArmor: true });
                    InventoryUtil.clearItem(player, selectedItem);
                    return;
                }
            }

            if (selectedItem?.typeId === GameData.RemoveDragonArmorItemTypeId) {
                const hasArmor = this.entityF.getProperty("gm1_zen:has_armor") as boolean;
                if (hasArmor) {
                    this.entityF.setProperty("gm1_zen:has_armor", false);
                    DragonPersistentData.updatePersistentData(this.entityId, { hasArmor: false });

                    const itemToDrop = new ItemStack(GameData.DragonArmorItemTypeId);
                    EntityUtil.spawnItemAtDimLoc(itemToDrop, this.entityF);

                    return;
                }
            }

            const dyeColorIdx = GameData.DyeColorMap.get(selectedItem?.typeId ?? "");
            if (dyeColorIdx !== undefined && dyeColorIdx >= 0 && dyeColorIdx <= 16) {
                this.entityF.setProperty("gm1_zen:color", dyeColorIdx);
                InventoryUtil.consumeSelectedItem(player);
                BroadcastUtil.debugSystem(
                    "DragonInteractions",
                    `Player ${player.name} dyed dragon ${this.entityId} with color ${dyeColorIdx}`
                );
                return;
            }

            if (selectedItem && GameData.RemoveDragonPaintItemTypeIds.includes(selectedItem.typeId)) {
                this.entityF.setProperty("gm1_zen:color", 0);
                InventoryUtil.setSelectedSlot(player, new ItemStack(GameData.RemoveDragonPaintSpentItemTypeId));
                return;
            }
        }

        if (this.wantsSystem.currentWant?.key === "playful") {
            this.wantsSystem.onInteractedWithWhilePlayful();
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Player ${player.name} interacted with dragon ${this.entityTypeId} while playful`
            );
            return;
        }

        if (this.tameSystem.isTamed() && player.isSneaking) {
            this.wantsSystem.removeWant();
            this.wantsSystem.toggleSitting();
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Player ${player.name} interacted with dragon ${this.entityTypeId} while sneaking`
            );
            return;
        }

        if (this.milestone.canBeFed && selectedItem) {
            const foodData = this.FoodData[selectedItem.typeId];
            if (foodData) {
                this.wantsSystem.onInteractedWithFood(player, selectedItem, foodData);
                BroadcastUtil.debugSystem(
                    "DragonInteractions",
                    `Player ${player.name} tried feeding dragon ${this.entityTypeId} with food ${selectedItem.typeId}`
                );
                return;
            }
        }

        const isSitting = this.propCache.rest_state != "none";
        if (this.tameSystem.isTamed() && !player.isSneaking && !isSitting) {
            const isSaddled = this.entityF.getProperty("gm1_zen:is_saddled") as boolean;
            if (!isSaddled) {
                player.sendMessage(this.TryToRideUnsaddledErrorMessage);
            } else {
                this.flightSystem.enable();
                this.timeout(() => {
                    const rideableComponent = this.entityF.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent;
                    if (rideableComponent?.getRiders().length == 0) rideableComponent.addRider(player);
                    this.rider = this.flightSystem.getRider();
                }, 1);
            }
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Player ${player.name} tried to ride dragon ${this.entityTypeId}. Is saddled: ${isSaddled}`
            );
            return;
        }

        BroadcastUtil.debugSystem(
            "DragonInteractions",
            `Player ${player.name} interacted with dragon ${this.entityTypeId}. No action taken`
        );
    }

    logValues() {
        this.log(this.entityTypeId);

        const healthComponent = this.entityF.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
        this.log(`Health: ${healthComponent.currentValue.toFixed(2)}/${healthComponent.effectiveMax.toFixed(2)}`);

        this.log(`Milestone: ${this.milestone.id} (Name: ${this.milestone.name})`);
        if (this.target) this.log(`Target: ${this.target instanceof Player ? this.target.name : (this.target?.typeId ?? "None")}`);
    }

    get milestone() {
        const trust = this.getPersistentProperty("Trust");
        const milestone = this.Milestones.find((m) => MathUtil.withinRange(trust, m.trustRange[0], m.trustRange[1]));
        if (milestone) return milestone;
        throw new Error(`Milestone for trust ${trust} not found`);
    }

    log(data: string) {
        if (this.logTick != Main.currentTick) this.logData = [];
        this.logTick = Main.currentTick;
        this.logData.push(data);
    }

    setProp<T extends keyof typeof Dragon.prototype.propCache, value extends Exclude<(typeof Dragon.prototype.propCache)[T], null>>(
        prop: T,
        value: value,
        onlyIfCurrentValueIs?: value[]
    ) {
        if (this.propCache[prop] === value) return;
        // if (onlyIfCurrentValueIs && this.propCache[prop] !== onlyIfCurrentValueIs) return;
        if (onlyIfCurrentValueIs && !onlyIfCurrentValueIs.includes(this.propCache[prop] as value)) return;
        this.propCache[prop] = value;
        this.entityF.setProperty(`gm1_zen:${prop}`, value);
    }
}
