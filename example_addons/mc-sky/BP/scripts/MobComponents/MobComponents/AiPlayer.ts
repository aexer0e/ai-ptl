import { Entity, EntityDamageCause, EntityInventoryComponent, ItemStack, Player, system } from "@minecraft/server";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import AiPlayers from "AiPlayers/AiPlayers";
import Archetype from "AiPlayers/Archetypes/Archetype";
import Archetypes from "AiPlayers/Archetypes/index";
import Goal from "AiPlayers/Goals/Goal";
import Goals from "AiPlayers/Goals/index";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import { PersistentProperties } from "Store/Entity/Properties";
import WorldStore from "Store/World/WorldStore";
import { AiPlayerGoal } from "Types/AiPlayerGoal";
import { ArmorTier } from "Types/ArmorSlot";
import BroadcastUtil from "Utilities/BroadcastUtil";
import DebugTimer from "Utilities/DebugTimer";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import PlayersCache from "Wrappers/PlayersCache";
import V3 from "Wrappers/V3";
import AiDeathMessages from "../../AiPlayers/AiDeathMessages";
import { joinedNames } from "./AiPlayerPersona";
import MobComponent from "./MobComponent";
export interface SerializedAiPlayer {
    name: string;
    trust: { [key: string]: number };
    trustLongTerm: { [key: string]: number };
    currentArchetype: keyof typeof Archetypes;
    properties: {
        is_using_item: string;
        bodytype: number;
        base: number;
        pants: number;
        shirt: number;
        eyes: number;
        eyes_color: number;
        mouth: number;
        mouth_color: number;
        hair: number;
        hair_color: number;
    };
    deaths: number;
    monstersKilled: number;
    woodObtained: number;
    stoneObtained: number;
    ironObtained: number;
    leatherObtained: number;
    diamondObtained: number;
    seriaizeTimestamp: number;
    hasLeft: boolean;
    lastDeathTick: number;
    lastLogoutTick: number;
    firstLoginTick: number;
    lastLoginTick: number;
    died: boolean;
    armorTier0: ArmorTier;
    armorTier1: ArmorTier;
    armorTier2: ArmorTier;
    armorTier3: ArmorTier;
    assignedAiBedEntityId: string;
}

export default class AiPlayer extends MobComponent {
    inventory: EntityInventoryComponent;

    static readonly EntityTypes = ["gm1_sky:ai_player"];
    static Goal: AiPlayerGoal = WorldStore.get("AiPlayerGoal");
    broadcastedDeathMessage: boolean = false;
    hasFleeingComponent = false;
    state: "neutral" | "follow" | "attack" | undefined;

    archetype: Archetype;
    archetypeId: keyof typeof Archetypes;

    secondsSinceOutisdePlayRange = 0;
    resetBanRunnerId?: number;
    confirmedBanRunnerId?: number;

    debugCache = {
        currentArchetypePriority: 0,
        archetypePriorityMap: new Map<number, string[]>(),
        currentGoalPriority: 0 as false | number,
        // goalPriorityMap: new Map<number, string[]>(),
        goalPriorityMap: [] as [string, number][],
    };
    static getTrust(entity: Entity, otherEntity: Entity) {
        const trustMap = JSON.parse(EntityStore.get(entity, "trust"));
        return trustMap[otherEntity.id] ?? 0;
    }

    static setTrust(entity: Entity, otherEntity: Entity, trust: number) {
        const trustMap = JSON.parse(EntityStore.get(entity, "trust"));
        trustMap[otherEntity.id] = trust;
        EntityStore.set(entity, "trust", JSON.stringify(trustMap));
    }

    static addTrust(entity: Entity, otherEntity: Entity, trust: number) {
        if (trust > 0) {
            AiPlayerWrapper.playTrustUpParticle(entity);
        } else if (trust < 0) {
            AiPlayerWrapper.playTrustDownParticle(entity);
        }
        this.setTrust(entity, otherEntity, this.getTrust(entity, otherEntity) + trust);
    }

    static getTrustLongTerm(entity: Entity, otherEntity: Entity) {
        const trustMap = JSON.parse(EntityStore.get(entity, "trustLongTerm"));
        return trustMap[otherEntity.id] ?? 0;
    }

    static setTrustLongTerm(entity: Entity, otherEntity: Entity, trust: number) {
        const trustMap = JSON.parse(EntityStore.get(entity, "trustLongTerm"));
        trustMap[otherEntity.id] = trust;
        EntityStore.set(entity, "trustLongTerm", JSON.stringify(trustMap));
    }

    static addTrustLongTerm(entity: Entity, otherEntity: Entity, trust: number) {
        this.setTrustLongTerm(entity, otherEntity, this.getTrustLongTerm(entity, otherEntity) + trust);
    }

    static getSocialBattery(entity: Entity) {
        return EntityStore.get(entity, "socialBattery");
    }

    static setSocialBattery(entity: Entity, value: number) {
        EntityStore.set(entity, "socialBattery", value);
    }

    static addSocialBattery(entity: Entity, value: number) {
        EntityStore.set(entity, "socialBattery", Math.min(100, Math.max(0, this.getSocialBattery(entity) + value)));
    }

    static timeSinceSeenMonster(entity: Entity) {
        return system.currentTick - EntityStore.temporary.get(entity, "monsterSeenTick");
    }

    static timeSincePlayerEmotedAt(entity: Entity) {
        return system.currentTick - EntityStore.temporary.get(entity, "playerEmotedAtTick");
    }

    constructor(entity: Entity) {
        super(entity, 1);

        entity.setProperty("gm1_sky:ban_level", 0);

        EntityStore.set(entity, "loadedTick", system.currentTick);

        this.inventory = entity.getComponent("inventory") as EntityInventoryComponent;

        this.onWorldEvent("WorldAfter", "entityDie", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.deadEntity.id !== this.entity.id) return;
            if (!this.broadcastedDeathMessage) AiDeathMessages.broadcastDeathMessage(eventData);
            this.addDeath(this.entity);
            AiPlayer.serialize(this.entity!, true);
        });

        this.onWorldEvent("WorldAfter", "entityHurt", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.hurtEntity.id == this.entity.id) {
                EntityStore.temporary.set(this.entity, "takenDamageTick", system.currentTick);
            }
            if (eventData.hurtEntity.id == this.entity.id && eventData.damageSource.damagingEntity?.typeId == "minecraft:player") {
                AiPlayer.addTrust(this.entity, eventData.damageSource.damagingEntity, -eventData.damage);
                AiPlayer.setSocialBattery(this.entity, 0);
            }

            if (eventData.damageSource.damagingEntity?.id == this.entity.id) {
                if (eventData.hurtEntity.typeId == "minecraft:player") {
                    AiPlayer.addTrust(this.entity, eventData.hurtEntity, eventData.damage);
                }

                AiPlayerWrapper.addHunger(this.entity, GameData.HungerConsumption.attack);
            }
        });

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;
            if (eventData.eventId == "gm1_sky:ban") {
                const banLevel = this.entity.getProperty("gm1_sky:ban_level") as number;
                this.entity.setProperty("gm1_sky:ban_level", banLevel + 1);
                const postAdditionBanLevel = banLevel + 1;
                if (postAdditionBanLevel < 2) {
                    if (this.resetBanRunnerId) system.clearRun(this.resetBanRunnerId);
                    this.resetBanRunnerId = system.runTimeout(() => {
                        if (!EntityUtil.isValid(this.entity)) return;
                        this.entity.setProperty("gm1_sky:ban_level", 0);
                        this.resetBanRunnerId = undefined;
                    }, 3 * 20);
                } else {
                    if (this.confirmedBanRunnerId) system.clearRun(this.confirmedBanRunnerId);
                    this.confirmedBanRunnerId = system.runTimeout(() => {
                        if (!this.entity?.isValid) return;
                        BroadcastUtil.say(`§c${this.name} has been banned!`);
                        this.entity.dimension.spawnParticle("gm1_sky:player_spawn", this.entity.location);
                        if (this.resetBanRunnerId) system.clearRun(this.resetBanRunnerId);
                        this.resetBanRunnerId = undefined;
                        return this.entity.remove();
                    }, 0.3 * 20);
                }
            }
        });

        this.onGameEvent("PlayerSneakingChanged", (player, isSneaking) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (isSneaking === false) return;

            const location = player.location;
            if (V3.distance(location, this.entity.location) > 8) return;

            const currentTrust = AiPlayer.getTrust(this.entity, player);
            if (currentTrust < -10 || currentTrust > 3) return;

            AiPlayer.addTrust(this.entity, player, 1);
        });

        this.onGameEvent("PlayerEmoted", (player, personaId) => {
            if (!EntityUtil.isValid(this.entity)) return;

            const location = player.location;
            if (V3.distance(location, this.entity.location) > 22) return;

            const playerLookDirection = player.getViewDirection();
            const directionToAi = new V3(this.entity.location).subtractV3(location).normalize();

            const dot = V3.dot(playerLookDirection, directionToAi);
            EntityUtil.canSeeEntity(this.entity, player, 10);
            if (dot < 0.8) return;

            EntityStore.temporary.set(this.entity, "playerEmotedAtTick", system.currentTick);
            EntityStore.temporary.set(this.entity, "playerEmotedAtPersonaId", personaId);
        });

        this.onGameEvent("aiPlayerAction", (entity, action) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (entity.id !== this.entity.id) return;

            if (action === "mineBlock") {
                AiPlayerWrapper.addHunger(this.entity, GameData.HungerConsumption.mineBlock);
            } else if (action === "attack") {
                AiPlayerWrapper.addHunger(this.entity, GameData.HungerConsumption.attack);
            }
        });

        const archetypeId = EntityStore.get(entity, "currentArchetype");
        if (Archetypes[archetypeId]) {
            let goal: Goal | undefined = undefined;
            const goalId = EntityStore.get(entity, "currentGoal");
            if (Goal[goalId]) goal = new Goals[goalId](entity);
            this.archetype = new Archetypes[archetypeId](entity, goal);
            this.archetypeId = archetypeId as keyof typeof Archetypes;
        } else {
            this.archetypeId = Object.keys(Archetypes)[0] as keyof typeof Archetypes;
            this.archetype = new Archetypes[this.archetypeId](entity);
            this.archetype.onEnter();
            EntityStore.set(entity, "currentArchetype", this.archetypeId);
        }
    }

    process() {
        DebugTimer.countStart("aiPlayerProcess.isValid");
        if (!EntityUtil.isValid(this.entity)) return;
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.readInventory");
        if (this.isCurrentTickNth(46)) {
            this.readInventory();
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.nearestPlayer");
        const nearestPlayer = AiPlayerWrapper.getNearestPlayer(this.entity);
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.distanceToNearestPlayer");
        const distanceToNearestPlayer = AiPlayerWrapper.getDistanceToNearestPlayer(this.entity);
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.monsterSeenTick");
        const recentlySeenMonster = AiPlayerWrapper.hasSeenMonsterInLastTicks(this.entity, 30);
        const recentlySeenMonsterTickEvery = recentlySeenMonster ? 7 : 37;
        if (this.isCurrentTickNth(recentlySeenMonsterTickEvery)) {
            const visibleNearbyMonster = EntityUtil.visibleNearbyMob(this.entity, { families: ["monster"] }, 10) != undefined;
            if (visibleNearbyMonster) {
                EntityStore.temporary.set(this.entity, "monsterSeenTick", system.currentTick);
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.mobSeenTick");
        const recentlySeenMob = AiPlayerWrapper.hasSeenMobInLastTicks(this.entity, 30);
        const recentlySeenMobTickEvery = recentlySeenMob ? 7 : 37;
        if (this.isCurrentTickNth(recentlySeenMobTickEvery)) {
            const visibleNearbyMob =
                EntityUtil.visibleNearbyMob(this.entity, { excludeNames: [this.entity.nameTag], excludeTypes: ["minecraft:item"] }, 10) !=
                undefined;
            if (visibleNearbyMob) {
                EntityStore.temporary.set(this.entity, "mobSeenTick", system.currentTick);
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.bedSeenTick");
        const recentlySeenBed = AiPlayerWrapper.hasSeenBedInLastTicks(this.entity, 30);
        const recentlySeenBedTickEvery = recentlySeenBed ? 7 : 27;
        if (this.isCurrentTickNth(recentlySeenBedTickEvery)) {
            const assignedAiBedEntityId = EntityStore.get(this.entity, "assignedAiBedEntityId");
            if (assignedAiBedEntityId.length > 0) {
                const bedEntity = EntityUtil.getEntityById(assignedAiBedEntityId);
                if (bedEntity && EntityUtil.isEntityVisible(new V3(bedEntity!.location).addY(1.4), this.entity, 28)) {
                    EntityStore.temporary.set(this.entity, "bedSeenTick", system.currentTick);
                }
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.trust");
        if (this.isCurrentTickNth(100) && nearestPlayer) {
            if (distanceToNearestPlayer < 10) {
                AiPlayer.addTrustLongTerm(this.entity, nearestPlayer, 1);
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.hunger");
        if (this.isCurrentTickNth(GameData.HungerConsumption.movementCheckIterval)) {
            const isMoving = new V3(this.entity.getVelocity()).length() > 0.2;
            AiPlayerWrapper.addHunger(this.entity, isMoving ? GameData.HungerConsumption.moving : GameData.HungerConsumption.notMoving);
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.hungerDamage");
        if (this.isCurrentTickNth(GameData.HungerDamageInterval)) {
            const hunger = AiPlayerWrapper.getHunger(this.entity);
            if (hunger <= GameData.HungerDamageThreshold) {
                this.entity.applyDamage(GameData.HungerDamageAmount, { cause: EntityDamageCause.starve });
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.hungerHealth");
        if (this.isCurrentTickNth(GameData.HealFromHungerInterval)) {
            const health = AiPlayerWrapper.getHealth(this.entity);
            const hunger = AiPlayerWrapper.getHunger(this.entity);
            if (hunger >= GameData.HealFromHungerHungerThreshhold && health <= GameData.HealFromHungerHealthThreshhold) {
                AiPlayerWrapper.addHealth(this.entity, GameData.HealFromHungerHealthAmount);
                AiPlayerWrapper.addHunger(this.entity, GameData.HungerConsumption.heal);
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.rcBlock");
        this.detectRcBlocks();
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.socialBattery");
        if (this.isCurrentTickNth(20)) {
            if (this.archetype.currentGoalId == "FollowPlayers" && distanceToNearestPlayer <= 8) {
                AiPlayer.addSocialBattery(this.entity, -2);
            } else {
                AiPlayer.addSocialBattery(this.entity, 1);
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.shouldDisconnect");
        if (this.isCurrentTickNth(20)) {
            if (distanceToNearestPlayer > 60) this.secondsSinceOutisdePlayRange += 1;
            else this.secondsSinceOutisdePlayRange = 0;

            if (this.secondsSinceOutisdePlayRange > 7) {
                AiPlayer.serialize(this.entity);
                this.entity.remove();
                return;
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.archetype");
        if (this.isCurrentTickNth(24)) {
            const currentArchetypePriority = Archetypes[this.archetypeId].priority(this.entity);
            this.debugCache.currentArchetypePriority = currentArchetypePriority;
            const archetypePriorityMap = new Map<number, string[]>();
            for (const archetypeId in Archetypes) {
                const archetype = Archetypes[archetypeId] as (typeof Archetypes)[keyof typeof Archetypes];
                if (this.archetype && this.archetypeId === archetypeId) continue;
                const priority = archetype.priority(this.entity);
                if (!archetypePriorityMap.has(priority)) archetypePriorityMap.set(priority, []);
                archetypePriorityMap.get(priority)!.push(archetypeId);
            }
            this.debugCache.archetypePriorityMap = archetypePriorityMap;

            const lowestPriorityInt = Math.min(...Array.from(archetypePriorityMap.keys()));

            if (lowestPriorityInt < currentArchetypePriority) {
                const newArchetypeId = archetypePriorityMap.get(lowestPriorityInt)![0];
                const newArchetype = Archetypes[newArchetypeId] as (typeof Archetypes)[keyof typeof Archetypes];
                this.archetype.onExit();
                this.archetype.destroy();

                this.archetype.currentGoal?.onExit();
                this.archetype.currentGoal?.destroy();

                this.archetypeId = newArchetypeId as keyof typeof Archetypes;
                EntityStore.set(this.entity, "currentArchetype", this.archetypeId);
                this.archetype = new newArchetype(this.entity);
                this.archetype.onEnter();
                return;
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.goal");
        if (this.isCurrentTickNth(28)) {
            let currentGoalPriority: number | false = Infinity;
            if (this.archetype.currentGoal) {
                const currentGoalEntry = this.archetype.goals[this.archetype.currentGoalId!];
                // @ts-ignore
                currentGoalPriority = currentGoalEntry.priority(
                    // @ts-ignore
                    this.archetype.currentGoal,
                    this.archetype.currentGoalId,
                    // @ts-ignore
                    this.archetype.currentGoal?.complete
                );
                this.debugCache.currentGoalPriority = currentGoalPriority;
            }

            const eligiblGoalsWithFalse: [goalId: string, priority: number | false][] = [this.archetype.goals]
                .map((arch) => {
                    if (!arch) return undefined;
                    return Object.entries(arch).map(([goalId, goalEntry]) => [
                        goalId,
                        // @ts-ignore
                        goalEntry.priority(this.archetype.currentGoal, this.archetype.currentGoalId, this.archetype.currentGoal?.complete),
                    ]);
                })
                .filter((x) => x)
                .flat() as [string, number | false][];

            const eligiblGoals = eligiblGoalsWithFalse.filter(([, priority]) => priority !== false) as [string, number][];

            let newEligibleGoal: [string, number] | undefined = undefined;

            if (eligiblGoals.length === 1) {
                newEligibleGoal = eligiblGoals[0];
                this.debugCache.goalPriorityMap = [newEligibleGoal];
            } else {
                const sortedEligibleGoals = eligiblGoals
                    .sort((a, b) => a[1] - b[1])
                    .filter(([goalId]) => goalId !== this.archetype.currentGoalId);

                newEligibleGoal = sortedEligibleGoals[0];
                this.debugCache.goalPriorityMap = sortedEligibleGoals;
            }

            if (!newEligibleGoal) {
                this.archetype.currentGoal?.onExit();
                this.archetype.currentGoal?.destroy();
                this.archetype.currentGoalId = undefined;
                this.archetype.currentGoal = undefined;
                return;
            }

            const lowestGoalPriorityInt = newEligibleGoal[1];
            if (currentGoalPriority === false || lowestGoalPriorityInt < currentGoalPriority) {
                const newGoalId = newEligibleGoal[0];
                const newGoal = Goals[newGoalId] as (typeof Goals)[keyof typeof Goals];
                this.archetype.currentGoal?.onExit();
                this.archetype.currentGoal?.destroy();

                this.triggerEvent("reset_target");
                this.archetype.currentGoalId = newGoalId as keyof typeof Goals;
                this.archetype.currentGoal = new newGoal(this.entity);
                this.archetype.currentGoal.onEnter();
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.debugName");
        if (WorldStore.get("AiPlayerDebugNames"))
            this.setDebugName(
                this.debugCache.currentArchetypePriority,
                this.debugCache.archetypePriorityMap,
                this.debugCache.currentGoalPriority,
                this.debugCache.goalPriorityMap
            );
        else this.entity!.nameTag = EntityStore.get(this.entity!, "name");
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.followMarker");
        if (this.isCurrentTickNth(3)) {
            const currentFollowMarker = EntityStore.getLinkedEntity(this.entity!);
            const targetItem = EntityStore.temporary.get(this.entity, "targetItem");
            const targetBlock = EntityStore.temporary.get(this.entity, "targetBlock");
            if (!targetBlock && !targetItem && currentFollowMarker) {
                currentFollowMarker.remove();
            } else if (targetItem && !currentFollowMarker) {
                const marker = EntityUtil.spawnEntity("gm1_sky:follow_marker", this.entity!.location, this.entity!.dimension);
                EntityStore.linkEntities(this.entity!, marker);
            } else if (targetBlock && !currentFollowMarker) {
                const marker = EntityUtil.spawnEntity("gm1_sky:follow_marker", this.entity!.location, this.entity!.dimension);
                EntityStore.linkEntities(this.entity!, marker);
            }
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.tick");
        if (this.archetype.tickEvery && this.isCurrentTickNth(this.archetype.tickEvery)) {
            this.archetype.onTick();
        }

        if (this.archetype.currentGoal?.tickEvery && this.isCurrentTickNth(this.archetype.currentGoal.tickEvery)) {
            this.archetype.currentGoal.onTick();
        }
        DebugTimer.countEnd();

        DebugTimer.countStart("aiPlayerProcess.trustState");
        if (this.isCurrentTickNth(9)) {
            this.setTrustState(nearestPlayer);
        }
        DebugTimer.countEnd();
    }

    rcBlockIterationX = 0;
    rcBlockIterationY = 0;
    detectRcBlocks() {
        const raycastsPerTick = 5;
        let raycastsThisTick = 0;

        const rcOrigin = new V3(this.entity!.location).addY(1.8);
        const dimension = this.entity!.dimension;
        const rcBlockCache = EntityStore.temporary.get(this.entity!, "rcBlockCache");

        const currentOre = rcBlockCache.ore;
        if (currentOre?.block?.isValid() && !GameData.ItemGroup["minecraft:ore"].includes(currentOre.block.typeId)) {
            rcBlockCache.ore = { timestamp: rcBlockCache.ore?.timestamp || 0 };
        }
        const currentLog = rcBlockCache.log;
        if (currentLog?.block?.isValid() && !GameData.ItemGroup["minecraft:log"].includes(currentLog.block.typeId)) {
            rcBlockCache.log = { timestamp: rcBlockCache.log?.timestamp || 0 };
        }
        const currentDoor = rcBlockCache.log;
        if (currentDoor?.block?.isValid() && !GameData.ItemGroup["minecraft:door"].includes(currentDoor.block.typeId)) {
            rcBlockCache.door = { timestamp: rcBlockCache.door?.timestamp || 0 };
        }
        const currentChest = rcBlockCache.log;
        if (currentChest?.block?.isValid() && !GameData.ItemGroup["minecraft:chest"].includes(currentChest.block.typeId)) {
            rcBlockCache.chest = { timestamp: rcBlockCache.chest?.timestamp || 0 };
        }

        while (raycastsThisTick < raycastsPerTick) {
            this.rcBlockIterationX = MathUtil.random(0, 360);
            this.rcBlockIterationY = MathUtil.random(-90, 30);
            const direction = V3.fromYawPitch(this.rcBlockIterationX, this.rcBlockIterationY / 90);

            // this.rcBlockIterationX += Math.max(-this.rcBlockIterationY / 3, 3);
            // if (this.rcBlockIterationX >= 360) {
            // Clipboard.drawLine(rcOrigin, rcOrigin.addV3(direction.multiply(10)), 2);
            // console.warn(this.rcBlockIterationX, this.rcBlockIterationY, direction.y);
            // this.rcBlockIterationX = 20;
            // this.rcBlockIterationY -= 1;
            // if (this.rcBlockIterationY < -90) {
            //     this.rcBlockIterationY = 0;
            // }
            // }
            raycastsThisTick += 1;

            const rcResult = dimension.getBlockFromRay(rcOrigin, direction, {
                maxDistance: 28,
                includePassableBlocks: true,
                includeLiquidBlocks: true,
            });
            if (!rcResult || !rcResult.block.isValid()) continue;
            const block = rcResult.block;

            const isLog = GameData.ItemGroup["minecraft:log"].includes(block.typeId);
            if (isLog) {
                rcBlockCache.log = { block, timestamp: system.currentTick, faceLocation: new V3(rcResult.faceLocation) };
                // Clipboard.drawLine(rcOrigin, rcOrigin.addV3(direction.multiply(35)));
                continue;
            }

            const isOre = GameData.ItemGroup["minecraft:ore"].includes(block.typeId);
            if (isOre) {
                rcBlockCache.ore = { block, timestamp: system.currentTick, faceLocation: new V3(rcResult.faceLocation) };
                // Clipboard.drawLine(rcOrigin, rcOrigin.addV3(direction.multiply(35)));
                continue;
            }

            const isDoor = GameData.ItemGroup["minecraft:door"].includes(block.typeId);
            if (isDoor) {
                rcBlockCache.door = { block, timestamp: system.currentTick, faceLocation: new V3(rcResult.faceLocation) };
                // Clipboard.drawLine(rcOrigin, rcOrigin.addV3(direction.multiply(35)));
                continue;
            }

            const isChest = GameData.ItemGroup["minecraft:chest"].includes(block.typeId);
            if (isChest) {
                rcBlockCache.chest = { block, timestamp: system.currentTick, faceLocation: new V3(rcResult.faceLocation) };
                // Clipboard.drawLine(rcOrigin, rcOrigin.addV3(direction.multiply(35)));
                continue;
            }
        }
    }

    setTrustState(nearestPlayer?: Player) {
        let state: "neutral" | "follow" | "attack" = "neutral";

        if (nearestPlayer) {
            const trust = AiPlayer.getTrust(this.entity!, nearestPlayer);
            const distance = V3.distance(nearestPlayer.location, this.entity!.location);
            if (trust > 0 && distance > 12) {
                state = "follow";
            } else if (trust < -3 && distance < 10) {
                state = "attack";
            }
        }

        if (state === this.state) return;

        if (state === "follow") {
            this.entity?.addTag("should_follow_players");
            this.entity?.removeTag("should_attack_players");
        }

        if (state === "attack") {
            this.entity?.addTag("should_attack_players");
            this.entity?.removeTag("should_follow_players");
        }

        if (state === "neutral") {
            this.entity?.removeTag("should_follow_players");
            this.entity?.removeTag("should_attack_players");
        }

        this.state = state;
    }

    triggerEvent(eventId: string) {
        this.entity!.triggerEvent(`gm1_sky:${eventId}`);
    }

    setDebugName(
        currentArchetypePriority: number,
        archetypePriorityMap: Map<number, string[]>,
        currentGoalPriority?: number | false,
        goalPriorityList?: [string, number][]
    ) {
        const debugName = [] as string[];
        debugName.push(`§a${this.archetypeId} (${currentArchetypePriority})`);
        for (const [priority, archetypeIds] of archetypePriorityMap.entries()) {
            debugName.push(`§e${priority}: ${archetypeIds.join(", ")}`);
        }
        debugName.push(`§a${this.archetype.currentGoalId} (${currentGoalPriority})`);
        if (goalPriorityList) {
            const goalPriorityMap = new Map<number, string[]>();
            for (const [goalId, priority] of goalPriorityList) {
                if (!goalPriorityMap.has(priority)) goalPriorityMap.set(priority, []);
                goalPriorityMap.get(priority)!.push(goalId);
            }
            for (const [priority, goalIds] of goalPriorityMap.entries()) {
                debugName.push(`§e${priority}: ${goalIds.join(", ")}`);
            }
        }
        debugName.push(`§bTrust: §r${EntityStore.get(this.entity!, "trust")} (${this.state})`);
        debugName.push(`§bTrustLongTerm: §r${EntityStore.get(this.entity!, "trustLongTerm")}`);
        // debugName.push(`§bSocialBattery: §r${EntityStore.get(this.entity!, "socialBattery")}`);
        debugName.push(`§bHunger: §r${EntityStore.get(this.entity!, "hunger")}`);

        const doorNearbyTime = AiPlayerWrapper.timeSinceDoorNearby(this.entity!);
        if (doorNearbyTime < 500) debugName.push(`§bLast Seen door : §r${doorNearbyTime}`);
        const chestNearbyTime = AiPlayerWrapper.timeSinceChestNearby(this.entity!);
        if (chestNearbyTime < 500) debugName.push(`§bLast Seen chest : §r${chestNearbyTime}`);

        // debugName.push(`§bLast Logout: §r${AiPlayerWrapper.timeSince(EntityStore.get(this.entity!, "lastLogoutTick"))}`);
        // debugName.push(`§bFirst Login: §r${AiPlayerWrapper.timeSince(EntityStore.get(this.entity!, "firstLoginTick"))}`);
        // debugName.push(`§bLast Death: §r${AiPlayerWrapper.timeSince(EntityStore.get(this.entity!, "lastDeathTick"))}`);
        // debugName.push(`§bLast Login: §r${AiPlayerWrapper.timeSince(EntityStore.get(this.entity!, "lastLoginTick"))}`);
        // debugName.push(`§bLast Respawn: §r${AiPlayerWrapper.timeSince(EntityStore.get(this.entity!, "lastRespawnTick"))}`);
        // debugName.push(`§bLast Relocate: §r${AiPlayerWrapper.timeSince(EntityStore.get(this.entity!, "lastRelocateTick"))}`);
        // debugName.push(`§bDeaths: §r${EntityStore.get(this.entity!, "deaths")}`);

        const lastEmotedAt = AiPlayerWrapper.timeSincePlayerEmotedAt(this.entity!);
        const lastEmote = GameData.EmotePersonaIdMap[EntityStore.temporary.get(this.entity!, "playerEmotedAtPersonaId")];
        if (lastEmotedAt < 500) debugName.push(`§bLast Emoted At: §r${lastEmotedAt} (${lastEmote})`);

        const lastSeenMonster = AiPlayerWrapper.timeSinceSeenMonster(this.entity!);
        if (lastSeenMonster < 500) debugName.push(`§bLast Seen Monster: §r${lastSeenMonster}`);

        const lastSeenMob = AiPlayerWrapper.timeSinceSeenMob(this.entity!);
        if (lastSeenMob < 500) debugName.push(`§bLast Seen Mob: §r${lastSeenMob}`);

        const lastSeenBed = AiPlayerWrapper.timeSinceSeenBed(this.entity!);
        if (lastSeenBed < 500) debugName.push(`§bLast Seen Bed: §r${lastSeenBed}`);

        const takenDamageTime = AiPlayerWrapper.timeSince(EntityStore.temporary.get(this.entity!, "takenDamageTick"));
        if (takenDamageTime < 500) debugName.push(`§bLast Taken Damage: §r${takenDamageTime}`);

        const fpLastChoppedTree = AiPlayerWrapper.timeSince(
            PlayersCache.getPlayerCache(AiPlayerWrapper.getNearestPlayer(this.entity!)!)?.choppedTreeTimestamp || 0
        );
        if (fpLastChoppedTree < 500) debugName.push(`§bFP Last Chopped Tree: §r${fpLastChoppedTree}`);
        const fpLastMinedOre = AiPlayerWrapper.timeSince(
            PlayersCache.getPlayerCache(AiPlayerWrapper.getNearestPlayer(this.entity!)!)?.minedOreTimestamp || 0
        );
        if (fpLastMinedOre < 500) debugName.push(`§bFP Last Mined Ore: §r${fpLastMinedOre}`);
        const fpLastAttackedHostileMob = AiPlayerWrapper.timeSince(
            PlayersCache.getPlayerCache(AiPlayerWrapper.getNearestPlayer(this.entity!)!)?.attackedHostileMobTimestamp || 0
        );
        if (fpLastAttackedHostileMob < 500) debugName.push(`§bFP Last Attacked Hostile Mob: §r${fpLastAttackedHostileMob}`);
        const fpLastAttackedPassiveMob = AiPlayerWrapper.timeSince(
            PlayersCache.getPlayerCache(AiPlayerWrapper.getNearestPlayer(this.entity!)!)?.attackedPassiveMobTimestamp || 0
        );
        if (fpLastAttackedPassiveMob < 500) debugName.push(`§bFP Last Attacked Passive Mob: §r${fpLastAttackedPassiveMob}`);

        // @ts-ignore Not all gaols have the complete property
        const goalIsComplete = this.archetype.currentGoal?.complete;
        debugName.push("Current goal is complete: " + goalIsComplete);

        debugName.unshift(EntityStore.get(this.entity!, "name"));

        this.entity!.nameTag = debugName.join("\n§r");
    }

    static serialize(
        entity: Entity,
        died = false,
        leaveWorld = MathUtil.chance(AiPlayers.LeaveChance(MathUtil.timeSince(EntityStore.get(entity, "loadedTick"))))
    ) {
        const currentAiPlayersCount = AiPlayers.aiPlayersCount();
        const archetypeId = EntityStore.get(entity, "currentArchetype") as keyof typeof Archetypes;

        if (currentAiPlayersCount >= GameData.MaxSerializableAiPlayers) return; // Don't serialize if we are at max count

        const jsonObj: SerializedAiPlayer = {
            name: EntityStore.get(entity, "name"),
            trust: JSON.parse(EntityStore.get(entity, "trust")),
            trustLongTerm: JSON.parse(EntityStore.get(entity, "trustLongTerm")),
            currentArchetype: archetypeId,
            properties: {
                is_using_item: entity.getProperty("gm1_sky:is_using_item") as string,
                bodytype: entity.getProperty("gm1_sky:bodytype") as number,
                base: entity.getProperty("gm1_sky:base") as number,
                pants: entity.getProperty("gm1_sky:pants") as number,
                shirt: entity.getProperty("gm1_sky:shirt") as number,
                eyes: entity.getProperty("gm1_sky:eyes") as number,
                eyes_color: entity.getProperty("gm1_sky:eyes_color") as number,
                mouth: entity.getProperty("gm1_sky:mouth") as number,
                mouth_color: entity.getProperty("gm1_sky:mouth_color") as number,
                hair: entity.getProperty("gm1_sky:hair") as number,
                hair_color: entity.getProperty("gm1_sky:hair_color") as number,
            },
            deaths: EntityStore.get(entity, "deaths"),
            monstersKilled: EntityStore.get(entity, "monstersKilled"),
            woodObtained: EntityStore.get(entity, "woodObtained"),
            stoneObtained: EntityStore.get(entity, "stoneObtained"),
            leatherObtained: EntityStore.get(entity, "leatherObtained"),
            ironObtained: EntityStore.get(entity, "ironObtained"),
            diamondObtained: EntityStore.get(entity, "diamondObtained"),
            lastDeathTick: EntityStore.get(entity, "lastDeathTick"),
            lastLogoutTick: leaveWorld ? system.currentTick : EntityStore.get(entity, "lastLogoutTick"),
            firstLoginTick: EntityStore.get(entity, "firstLoginTick"),
            lastLoginTick: EntityStore.get(entity, "lastLoginTick"),
            seriaizeTimestamp: system.currentTick,
            hasLeft: leaveWorld,
            died,
            armorTier0: EntityStore.get(entity, "armorTier0"),
            armorTier1: EntityStore.get(entity, "armorTier1"),
            armorTier2: EntityStore.get(entity, "armorTier2"),
            armorTier3: EntityStore.get(entity, "armorTier3"),
            assignedAiBedEntityId: EntityStore.get(entity, "assignedAiBedEntityId"),
        };

        if (died) {
            const head_tire = jsonObj.armorTier0;
            const body_tire = jsonObj.armorTier1;
            const legs_tire = jsonObj.armorTier2;
            const feet_tire = jsonObj.armorTier3;

            if (head_tire !== ArmorTier.None) {
                EntityUtil.spawnItem(new ItemStack(`minecraft:${head_tire}_helmet`), entity.location, entity.dimension);
            }
            if (body_tire !== ArmorTier.None) {
                EntityUtil.spawnItem(new ItemStack(`minecraft:${body_tire}_chestplate`), entity.location, entity.dimension);
            }
            if (legs_tire !== ArmorTier.None) {
                EntityUtil.spawnItem(new ItemStack(`minecraft:${legs_tire}_leggings`), entity.location, entity.dimension);
            }
            if (feet_tire !== ArmorTier.None) {
                EntityUtil.spawnItem(new ItemStack(`minecraft:${feet_tire}_boots`), entity.location, entity.dimension);
            }

            jsonObj.armorTier0 = ArmorTier.None;
            jsonObj.armorTier1 = ArmorTier.None;
            jsonObj.armorTier2 = ArmorTier.None;
            jsonObj.armorTier3 = ArmorTier.None;
            EntityStore.set(entity, "armorTier0", ArmorTier.None);
            EntityStore.set(entity, "armorTier1", ArmorTier.None);
            EntityStore.set(entity, "armorTier2", ArmorTier.None);
            EntityStore.set(entity, "armorTier3", ArmorTier.None);

            // const allItems = InventoryUtil.getAllInventoryItems(entity);
            // for (const { itemStack, slot } of allItems) {
            //     console.warn(itemStack.typeId, " + ", slot);
            // }
            // for (const { itemStack, slot } of allItems) {
            //     if (itemStack && itemStack.typeId !== "minecraft:air") {
            //         console.warn(itemStack.typeId);
            //         const itemToDrop = itemStack.clone();
            //         EntityUtil.spawnItem(itemToDrop, entity.location, entity.dimension);
            //         InventoryUtil.clearInventorySlot(entity, slot);
            //     }
            // }
        }

        WorldStore.pushToArray("SerializedAiPlayers", JSON.stringify(jsonObj));

        if (leaveWorld) {
            GameData.events.emit("aiPlayerMessage", entity, EntityStore.get(entity, "name"), "Bye", 0.8);
            BroadcastUtil.translate("multiplayer.player.left", [this.name], null, "§e");
            joinedNames.delete(this.name);
        }
    }

    get name() {
        return EntityStore.get(this.entity!, "name");
    }

    addDeath(entity: Entity) {
        const deaths = EntityStore.get(entity, "deaths") + 1;
        const woodObtained = EntityStore.get(entity, "woodObtained");
        const stoneObtained = EntityStore.get(entity, "stoneObtained");
        const ironObtained = EntityStore.get(entity, "ironObtained");
        const leatherObtained = EntityStore.get(entity, "leatherObtained");
        const diamondObtained = EntityStore.get(entity, "diamondObtained");
        EntityStore.set(entity, "woodObtained", woodObtained / 2);
        EntityStore.set(entity, "stoneObtained", stoneObtained / 2);
        EntityStore.set(entity, "ironObtained", ironObtained / 2);
        EntityStore.set(entity, "leatherObtained", leatherObtained / 2);
        EntityStore.set(entity, "diamondObtained", diamondObtained / 2);
        EntityStore.set(entity, "deaths", deaths);
        EntityStore.set(entity, "lastDeathTick", system.currentTick);
    }

    readInventory() {
        if (!EntityUtil.isValid(this.entity) || !EntityUtil.isAlive(this.entity)) return;
        if (!this.inventory) return;

        const woodObtained = EntityStore.get(this.entity, "woodObtained");
        const stoneObtained = EntityStore.get(this.entity, "stoneObtained");
        const ironObtained = EntityStore.get(this.entity, "ironObtained");
        const leatherObtained = EntityStore.get(this.entity, "leatherObtained");
        const diamondObtained = EntityStore.get(this.entity, "diamondObtained");

        let addToWood = 0;
        let addToStone = 0;
        let addToIron = 0;
        let addToLeather = 0;
        let addToDiamond = 0;

        for (let i = 0; i < this.inventory.inventorySize; i++) {
            const item = this.inventory.container?.getSlot(i);
            if (item?.getItem() == undefined) continue;
            if (GameData.ItemGroup["minecraft:log"].includes(item.typeId)) {
                addToWood += item.amount;
            }
            if (GameData.ItemGroup["minecraft:stone"].includes(item.typeId)) {
                addToStone += item.amount;
            }
            if (GameData.ItemGroup["minecraft:leather"].includes(item.typeId)) {
                addToLeather += item.amount;
            }
            if (GameData.ItemGroup["minecraft:iron"].includes(item.typeId)) {
                addToIron += item.amount;
            }
            if (GameData.ItemGroup["minecraft:diamond"].includes(item.typeId)) {
                addToDiamond += item.amount;
            }
        }

        this.setResource(this.entity, addToWood, woodObtained, "woodObtained");
        this.setResource(this.entity, addToStone, stoneObtained, "stoneObtained");
        this.setResource(this.entity, addToIron, ironObtained, "ironObtained");
        this.setResource(this.entity, addToLeather, leatherObtained, "leatherObtained");
        this.setResource(this.entity, addToDiamond, diamondObtained, "diamondObtained");
    }

    setResource(
        entity: Entity,
        countedResource: number,
        currentResource: number,
        persistentDataPointer: keyof typeof PersistentProperties
    ) {
        if (countedResource <= currentResource) return;
        countedResource -= currentResource;
        EntityStore.set(entity, persistentDataPointer, currentResource + countedResource);
    }

    destroy() {
        super.destroy();

        this.archetype.destroy();
        this.archetype.currentGoal?.destroy();
    }
}
