import { Block, Entity, EntityHealthComponent, EntityItemComponent, ItemStack, TimeOfDay, system, world } from "@minecraft/server";
import GameData, { EmoteType } from "Game/GameData";
import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import EntityStore from "Store/Entity/EntityStore";
import { TemporaryProperties } from "Store/Entity/Properties";
import { AiPlayerAction } from "Types/GameEvents";
import { Volume } from "Types/Volume";
import EntityUtil from "Utilities/EntityUtil";
import EntityWrapper from "Utilities/EntityWrapper";
import InventoryUtil from "Utilities/InventoryUtil";
import MathUtil from "Utilities/MathUtil";
import PlayersCache from "Wrappers/PlayersCache";
import V3 from "Wrappers/V3";
import { ArmorSlot, ArmorSlotCommandIdMap, ArmorTier, ArmorTierMap, ArmorTierValueMap } from "../Types/ArmorSlot";

const TimeOfDayValue = ["Sunrise", "Day", "Sunset", "Night"] as const;

const properties = {
    "gm1_sky:is_using_item": {
        default: "idle",
        type: "enum",
        values: ["idle", "swinging", "eating", "punching", "trust_up", "trust_down"],
        client_sync: true,
    },
    "gm1_sky:is_sneaking": { default: false, type: "bool", client_sync: true },
    "gm1_sky:is_in_darkness": { default: false, type: "bool", client_sync: true },
    "gm1_sky:is_emoting": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:bodytype": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:base": { default: 0, type: "int", range: [0, 199], client_sync: true },
    "gm1_sky:shirt": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:pants": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:eyes": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:eyes_color": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:mouth": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:mouth_color": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:hair": { default: 0, type: "int", range: [0, 199], client_sync: true },
    "gm1_sky:hair_color": { default: 0, type: "int", range: [0, 99], client_sync: true },
    "gm1_sky:has_land": { default: false, type: "bool", client_sync: false },
    "gm1_sky:air_punch": { default: 0, type: "int", range: [0, 99], client_sync: true },
};

export default abstract class AiPlayerWrapper extends EntityWrapper {
    entity: Entity;
    tickEvery: undefined | number;
    stateTime = 0;

    // static getCache<(aiPlayer: Entity, key: keyof typeof TemporaryProperties extends {value: any} ? keyof typeof TemporaryProperties : never) {
    // static getCache<T extends keyof typeof TemporaryProperties, K extends T extends Cache<T> ? T : never>(aiPlayer: Entity, key: K) {
    private static getCache<T extends keyof typeof TemporaryProperties>(aiPlayer: Entity, key: T) {
        return EntityStore.temporary.get(aiPlayer, key) as (typeof TemporaryProperties)[T];
    }

    private static setCache<T extends keyof typeof TemporaryProperties>(aiPlayer: Entity, key: T, value: (typeof TemporaryProperties)[T]) {
        EntityStore.temporary.set(aiPlayer, key, value);
    }

    constructor(entity: Entity) {
        super(entity);
        this.interval(() => this.stateTime++, 1);
    }

    static getNearestPlayer(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "nearestPlayer");
        if (!cache?.tick || cache.tick < system.currentTick - 20 || !cache.value) {
            this.setCache(aiPlayer, "nearestPlayer", {
                tick: system.currentTick,
                value: EntityUtil.getNearestPlayer(aiPlayer.location, aiPlayer.dimension),
            });
        }
        return this.getCache(aiPlayer, "nearestPlayer")!.value;
    }

    get nearestPlayer() {
        return AiPlayerWrapper.getNearestPlayer(this.entity);
    }

    static getDistanceToNearestPlayer(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "distanceToNearestPlayer");
        if (!cache?.tick || cache.tick < system.currentTick - 20 || !cache.value) {
            this.setCache(aiPlayer, "distanceToNearestPlayer", {
                tick: system.currentTick,
                value: this.getNearestPlayer(aiPlayer)?.location
                    ? V3.distance(aiPlayer.location, this.getNearestPlayer(aiPlayer)!.location)
                    : Infinity,
            });
        }
        return this.getCache(aiPlayer, "distanceToNearestPlayer")!.value;
    }

    get distanceToNearestPlayer() {
        return AiPlayerWrapper.getDistanceToNearestPlayer(this.entity);
    }

    static getNearestUsefulItemEntity(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "nearestItemEntity");
        if (cache?.tick !== system.currentTick) {
            const nearestItemEntity = EntityUtil.getEntities(
                { location: aiPlayer.location, closest: 1, type: "minecraft:item" },
                aiPlayer.dimension
            ).filter((e) => {
                const itemComponent = e.getComponent(EntityItemComponent.componentId) as EntityItemComponent;
                const allUsefulItemList = [...GameData.ArmorList, ...GameData.AiPlayerItemWhitelist];
                if (allUsefulItemList.includes(itemComponent.itemStack.typeId)) return true;
                else return false;
            })[0] as Entity | undefined;

            this.setCache(aiPlayer, "nearestItemEntity", {
                tick: system.currentTick,
                value: nearestItemEntity,
            });
        }
        return this.getCache(aiPlayer, "nearestItemEntity")!.value;
    }

    get nearestUsefulItemEntity() {
        return AiPlayerWrapper.getNearestUsefulItemEntity(this.entity);
    }

    static getNearestUsefulItem(aiPlayer: Entity) {
        const nearestItemEntity = this.getNearestUsefulItemEntity(aiPlayer);
        if (!nearestItemEntity) return;

        const itemComponent = nearestItemEntity.getComponent(EntityItemComponent.componentId) as EntityItemComponent;
        return itemComponent.itemStack;
    }

    get nearestUsefulItem() {
        return AiPlayerWrapper.getNearestUsefulItem(this.entity);
    }

    static getDistanceToNearestUsefulItem(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "distanceToNearestItem");
        if (cache?.tick !== system.currentTick) {
            this.setCache(aiPlayer, "distanceToNearestItem", {
                tick: system.currentTick,
                value: this.getNearestUsefulItemEntity(aiPlayer)
                    ? V3.distance(aiPlayer.location, this.getNearestUsefulItemEntity(aiPlayer)!.location)
                    : Infinity,
            });
        }
        return this.getCache(aiPlayer, "distanceToNearestItem")!.value;
    }

    get distanceToNearestUsefulItem() {
        return AiPlayerWrapper.getDistanceToNearestUsefulItem(this.entity);
    }

    static isNearestUsefulItemInGroup(aiPlayer: Entity, group: string[]) {
        return this.getNearestUsefulItem(aiPlayer) && group.includes(this.getNearestUsefulItem(aiPlayer)!.typeId);
    }

    isNearestUsefulItemInGroup(group: string[]) {
        return AiPlayerWrapper.isNearestUsefulItemInGroup(this.entity, group);
    }

    static getHealth(aiPlayer: Entity) {
        return (aiPlayer.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent).currentValue;
    }

    get health() {
        return AiPlayerWrapper.getHealth(this.entity);
    }

    static getTimeOfDay(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "timeOfDay");
        if (cache?.tick !== system.currentTick) {
            const time = world.getTimeOfDay();
            let timeOfDay = "Day";
            if (time >= TimeOfDay.Sunrise || time < TimeOfDay.Day) timeOfDay = "Sunrise";
            else if (time >= TimeOfDay.Day && time < TimeOfDay.Sunset) timeOfDay = "Day";
            else if (time >= TimeOfDay.Sunset && time < TimeOfDay.Night) timeOfDay = "Sunset";
            else if (time >= TimeOfDay.Night && time < TimeOfDay.Sunrise) timeOfDay = "Night";

            this.setCache(aiPlayer, "timeOfDay", {
                tick: system.currentTick,
                value: timeOfDay,
            });
        }

        return this.getCache(aiPlayer, "timeOfDay")!.value as (typeof TimeOfDayValue)[number];
    }

    get timeOfDay() {
        return AiPlayerWrapper.getTimeOfDay(this.entity);
    }

    static getBlockInside(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "blockInside");
        if (cache?.tick !== system.currentTick) {
            this.setCache(aiPlayer, "blockInside", {
                tick: system.currentTick,
                value: aiPlayer.dimension.getBlock(aiPlayer.location),
            });
        }
        return this.getCache(aiPlayer, "blockInside")!.value;
    }

    get blockInside() {
        return AiPlayerWrapper.getBlockInside(this.entity);
    }

    static getBlockBelow(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "blockBelow");
        if (cache?.tick !== system.currentTick) {
            this.setCache(aiPlayer, "blockBelow", {
                tick: system.currentTick,
                value: aiPlayer.dimension.getBlock(new V3(aiPlayer.location).addY(-1)),
            });
        }
        return this.getCache(aiPlayer, "blockBelow")!.value;
    }

    get blockBelow() {
        return AiPlayerWrapper.getBlockBelow(this.entity);
    }

    static getBlockAbove(aiPlayer: Entity) {
        const cache = this.getCache(aiPlayer, "blockAbove");
        if (cache?.tick !== system.currentTick) {
            this.setCache(aiPlayer, "blockAbove", {
                tick: system.currentTick,
                value: aiPlayer.dimension.getBlock(new V3(aiPlayer.location).addY(+1)),
            });
        }
        return this.getCache(aiPlayer, "blockAbove")!.value;
    }

    get blocAbove() {
        return AiPlayerWrapper.getBlockBelow(this.entity);
    }

    static isBlockInsideInGroup(aiPlayer: Entity, group: string[]) {
        return this.getBlockInside(aiPlayer) && group.includes(this.getBlockInside(aiPlayer)!.typeId);
    }

    isBlockInsideInGroup(group: string[]) {
        return AiPlayerWrapper.isBlockInsideInGroup(this.entity, group);
    }

    static isBlockBelowInGroup(aiPlayer: Entity, group: string[]) {
        return this.getBlockBelow(aiPlayer) && group.includes(this.getBlockBelow(aiPlayer)!.typeId);
    }

    isBlockAboveInGroup(group: string[]) {
        return AiPlayerWrapper.isBlockAboveInGroup(this.entity, group);
    }

    static isBlockAboveInGroup(aiPlayer: Entity, group: string[]) {
        return this.getBlockAbove(aiPlayer) && group.includes(this.getBlockAbove(aiPlayer)!.typeId);
    }

    isBlockBelowInGroup(group: string[]) {
        return AiPlayerWrapper.isBlockBelowInGroup(this.entity, group);
    }

    static setHealth(aiPlayer: Entity, value: number) {
        const healthComponent = aiPlayer.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
        const newValue = MathUtil.clamp(value, healthComponent.effectiveMin, healthComponent.effectiveMax);
        healthComponent.setCurrentValue(newValue);
    }

    static addHealth(aiPlayer: Entity, value: number) {
        const healthComponent = aiPlayer.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
        const newValue = MathUtil.clamp(healthComponent.currentValue + value, healthComponent.effectiveMin, healthComponent.effectiveMax);
        healthComponent.setCurrentValue(newValue);
    }

    setHealth(value: number) {
        AiPlayerWrapper.setHealth(this.entity, value);
    }

    addHealth(value: number) {
        AiPlayerWrapper.addHealth(this.entity, value);
    }

    static setHunger(aiPlayer: Entity, value: number) {
        value = MathUtil.clamp(value, 0, GameData.HungerMaxValue);
        const oldValue = EntityStore.get(aiPlayer, "hunger");

        if (value <= GameData.HungerExhaustionThreshold && oldValue > GameData.HungerExhaustionThreshold) {
            aiPlayer.addEffect("slowness", 1000000, {
                amplifier: GameData.ExhaustionSlownessAmplifier,
                showParticles: false,
            });
            GameData.events.emit("aiPlayerMessage", aiPlayer, EntityStore.get(aiPlayer, "name"), "Hungry", 1);
        } else if (value > GameData.HungerExhaustionThreshold && oldValue <= GameData.HungerExhaustionThreshold) {
            aiPlayer.removeEffect("slowness");
        }

        EntityStore.set(aiPlayer, "hunger", value);
    }

    static addHunger(aiPlayer: Entity, value: number) {
        this.setHunger(aiPlayer, this.getHunger(aiPlayer) + value);
    }

    setHunger(value: number) {
        AiPlayerWrapper.setHunger(this.entity, value);
    }

    addHunger(value: number) {
        AiPlayerWrapper.addHunger(this.entity, value);
    }

    static getHunger(aiPlayer: Entity) {
        return EntityStore.get(aiPlayer, "hunger");
    }

    get hunger() {
        return AiPlayerWrapper.getHunger(this.entity);
    }

    static getTrust(aiPlayer: Entity, otherEntity: Entity) {
        return AiPlayer.getTrust(aiPlayer, otherEntity);
    }

    getTrust(otherEntity: Entity) {
        return AiPlayerWrapper.getTrust(this.entity, otherEntity);
    }

    static getTrustLongTerm(aiPlayer: Entity, otherEntity: Entity) {
        return AiPlayer.getTrustLongTerm(aiPlayer, otherEntity);
    }

    getTrustLongTerm(otherEntity: Entity) {
        return AiPlayerWrapper.getTrustLongTerm(this.entity, otherEntity);
    }

    static getSocialBattery(aiPlayer: Entity) {
        return AiPlayer.getSocialBattery(aiPlayer);
    }

    get socialBattery() {
        return AiPlayerWrapper.getSocialBattery(this.entity);
    }

    static setSocialBattery(aiPlayer: Entity, value: number) {
        AiPlayer.setSocialBattery(aiPlayer, value);
    }

    setSocialBattery(value: number) {
        AiPlayerWrapper.setSocialBattery(this.entity, value);
    }

    static getAiPlayerName(aiPlayer: Entity) {
        return EntityStore.get(aiPlayer, "name");
    }

    get aiPlayerName() {
        return AiPlayerWrapper.getAiPlayerName(this.entity);
    }

    throwItem(item: ItemStack, direction = new V3(this.entity.getViewDirection())) {
        const itemEntity = EntityUtil.spawnItem(item, this.entity.getHeadLocation(), this.entity.dimension);
        if (!itemEntity) return;
        itemEntity.applyImpulse(direction.multiply(1));
    }

    setTrust(value: number, otherEntity: Entity) {
        AiPlayer.setTrust(this.entity, otherEntity, value);
    }

    setTrustLongTerm(value: number, otherEntity: Entity) {
        AiPlayer.setTrustLongTerm(this.entity, otherEntity, value);
    }

    static timeSinceSeenMonster(aiPlayer: Entity) {
        return system.currentTick - EntityStore.temporary.get(aiPlayer, "monsterSeenTick");
    }

    timeSinceSeenMonster() {
        return AiPlayerWrapper.timeSinceSeenMonster(this.entity);
    }

    static hasSeenMonsterInLastTicks(aiPlayer: Entity, ticks: number) {
        return this.timeSinceSeenMonster(aiPlayer) < ticks;
    }

    hasSeenMonsterInLastTicks(ticks: number) {
        return AiPlayerWrapper.hasSeenMonsterInLastTicks(this.entity, ticks);
    }

    static timeSinceSeenMob(aiPlayer: Entity) {
        return system.currentTick - EntityStore.temporary.get(aiPlayer, "mobSeenTick");
    }

    timeSinceSeenMob() {
        return AiPlayerWrapper.timeSinceSeenMob(this.entity);
    }

    static hasSeenMobInLastTicks(aiPlayer: Entity, ticks: number) {
        return this.timeSinceSeenMob(aiPlayer) < ticks;
    }

    hasSeenMobInLastTicks(ticks: number) {
        return AiPlayerWrapper.hasSeenMobInLastTicks(this.entity, ticks);
    }

    static timeSinceSeenBed(aiPlayer: Entity) {
        return system.currentTick - EntityStore.temporary.get(aiPlayer, "bedSeenTick");
    }

    timeSinceSeenBed() {
        return AiPlayerWrapper.timeSinceSeenBed(this.entity);
    }

    static hasSeenBedInLastTicks(aiPlayer: Entity, ticks: number) {
        return this.timeSinceSeenBed(aiPlayer) < ticks;
    }

    hasSeenBedInLastTicks(ticks: number) {
        return AiPlayerWrapper.hasSeenBedInLastTicks(this.entity, ticks);
    }

    static hasAssignedBedNearby(aiPlayer: Entity): boolean {
        const aiBedEntityId = EntityStore.get(aiPlayer, "assignedAiBedEntityId");
        if (aiBedEntityId == "") return false;
        const aiBedEntity = EntityUtil.getEntityById(aiBedEntityId);
        if (!aiBedEntity) return false;
        return V3.distance(aiBedEntity.location, aiPlayer.location) < 10;
    }

    static timeSinceTakenDamage(aiPlayer: Entity) {
        return system.currentTick - EntityStore.temporary.get(aiPlayer, "takenDamageTick");
    }

    timeSinceTakenDamage() {
        return AiPlayerWrapper.timeSinceTakenDamage(this.entity);
    }

    static hasTakenDamageInLastTicks(aiPlayer: Entity, ticks: number) {
        return this.timeSinceTakenDamage(aiPlayer) < ticks;
    }

    hasTakenDamageInLastTicks(ticks: number) {
        return AiPlayerWrapper.hasTakenDamageInLastTicks(this.entity, ticks);
    }

    static timeSincePlayerEmotedAt(aiPlayer: Entity, emote?: EmoteType) {
        const duration = system.currentTick - EntityStore.temporary.get(aiPlayer, "playerEmotedAtTick");

        if (!emote) return duration;
        else {
            const personaId = EntityStore.temporary.get(aiPlayer, "playerEmotedAtPersonaId");
            const playerEmote = GameData.EmotePersonaIdMap[personaId];
            return emote === playerEmote ? duration : system.currentTick;
        }
    }

    timeSincePlayerEmotedAt(emote?: EmoteType) {
        return AiPlayerWrapper.timeSincePlayerEmotedAt(this.entity, emote);
    }

    static hasPlayerEmotedAtInLastTicks(aiPlayer: Entity, ticks: number, emote?: EmoteType) {
        return this.timeSincePlayerEmotedAt(aiPlayer, emote) < ticks;
    }

    hasPlayerEmotedAtInLastTicks(ticks: number, emote?: EmoteType) {
        return AiPlayerWrapper.hasPlayerEmotedAtInLastTicks(this.entity, ticks, emote);
    }

    static timeSinceDoorNearby(aiPlayer: Entity) {
        const seenDoorTimestamp = EntityStore.temporary.get(aiPlayer, "rcBlockCache").door?.timestamp || 0;
        return system.currentTick - seenDoorTimestamp;
    }

    timeSinceDoorNearby() {
        return AiPlayerWrapper.timeSinceDoorNearby(this.entity);
    }
    static timeSinceChestNearby(aiPlayer: Entity) {
        const seenChestTimestamp = EntityStore.temporary.get(aiPlayer, "rcBlockCache").chest?.timestamp || 0;
        return system.currentTick - seenChestTimestamp;
    }

    timeSinceChestNearby() {
        return AiPlayerWrapper.timeSinceChestNearby(this.entity);
    }

    static timeSinceLastRespawn(aiPlayer: Entity) {
        return system.currentTick - EntityStore.get(aiPlayer, "lastRespawnTick");
    }

    timeSinceLastRespawn() {
        return AiPlayerWrapper.timeSinceLastRespawn(this.entity);
    }

    static timeSinceLastDeath(aiPlayer: Entity) {
        return system.currentTick - EntityStore.get(aiPlayer, "lastDeathTick");
    }

    timeSinceLastDeath() {
        return AiPlayerWrapper.timeSinceLastDeath(this.entity);
    }

    static timeSinceLastLogout(aiPlayer: Entity) {
        return system.currentTick - EntityStore.get(aiPlayer, "lastLogoutTick");
    }

    timeSinceLastLogout() {
        return AiPlayerWrapper.timeSinceLastLogout(this.entity);
    }

    static timeSinceFirstLogin(aiPlayer: Entity) {
        return system.currentTick - EntityStore.get(aiPlayer, "firstLoginTick");
    }

    timeSinceFirstLogin() {
        return AiPlayerWrapper.timeSinceFirstLogin(this.entity);
    }

    static timeSinceLastLogin(aiPlayer: Entity) {
        return system.currentTick - EntityStore.get(aiPlayer, "lastLoginTick");
    }

    timeSinceLastLogin() {
        return AiPlayerWrapper.timeSinceLastLogin(this.entity);
    }

    static timeSinceLastRelocate(aiPlayer: Entity) {
        return system.currentTick - EntityStore.get(aiPlayer, "lastRelocateTick");
    }

    timeSinceLastRelocate() {
        return AiPlayerWrapper.timeSinceLastRelocate(this.entity);
    }

    static FpHasAttackedPassiveMobInLastTicks(aiPlayer: Entity, ticks: number) {
        const nearestPlayer = this.getNearestPlayer(aiPlayer);
        if (!nearestPlayer) return false;

        const timestamp = PlayersCache.getPlayerCache(nearestPlayer)?.attackedPassiveMobTimestamp || 0;
        return system.currentTick - timestamp < ticks;
    }

    FpHasAttackedPassiveMobInLastTicks(ticks: number) {
        return AiPlayerWrapper.FpHasAttackedPassiveMobInLastTicks(this.entity, ticks);
    }

    static FpHasAttackedHostileMobInLastTicks(aiPlayer: Entity, ticks: number) {
        const nearestPlayer = this.getNearestPlayer(aiPlayer);
        if (!nearestPlayer) return false;

        const timestamp = PlayersCache.getPlayerCache(nearestPlayer)?.attackedHostileMobTimestamp || 0;
        return system.currentTick - timestamp < ticks;
    }

    FpHasAttackedHostileMobInLastTicks(ticks: number) {
        return AiPlayerWrapper.FpHasAttackedHostileMobInLastTicks(this.entity, ticks);
    }

    static FpHasMinedOreInLastTicks(aiPlayer: Entity, ticks: number) {
        const nearestPlayer = this.getNearestPlayer(aiPlayer);
        if (!nearestPlayer) return false;

        const timestamp = PlayersCache.getPlayerCache(nearestPlayer)?.minedOreTimestamp || 0;
        return system.currentTick - timestamp < ticks;
    }

    FpHasMinedOreInLastTicks(ticks: number) {
        return AiPlayerWrapper.FpHasMinedOreInLastTicks(this.entity, ticks);
    }

    static FpHasChoppedTreeInLastTicks(aiPlayer: Entity, ticks: number) {
        const nearestPlayer = this.getNearestPlayer(aiPlayer);
        if (!nearestPlayer) return false;

        const timestamp = PlayersCache.getPlayerCache(nearestPlayer)?.choppedTreeTimestamp || 0;
        return system.currentTick - timestamp < ticks;
    }

    FpHasChoppedTreeInLastTicks(ticks: number) {
        return AiPlayerWrapper.FpHasChoppedTreeInLastTicks(this.entity, ticks);
    }

    static FpLastAction(aiPlayer: Entity) {
        const nearestPlayer = this.getNearestPlayer(aiPlayer);
        if (!nearestPlayer) return;

        const actions = {
            AttackedPassiveMob: PlayersCache.getPlayerCache(nearestPlayer)?.attackedPassiveMobTimestamp || 0,
            AttackedHostileMob: PlayersCache.getPlayerCache(nearestPlayer)?.attackedHostileMobTimestamp || 0,
            MinedOre: PlayersCache.getPlayerCache(nearestPlayer)?.minedOreTimestamp || 0,
            ChoppedTree: PlayersCache.getPlayerCache(nearestPlayer)?.choppedTreeTimestamp || 0,
        } as const;

        const lastAction = Object.keys(actions).reduce((a, b) => (actions[a] > actions[b] ? a : b));

        return lastAction as keyof typeof actions;
    }

    FpLastAction() {
        return AiPlayerWrapper.FpLastAction(this.entity);
    }

    lookAtNearestPlayer() {
        if (!this.nearestPlayer) return;
        const direction = new V3(this.nearestPlayer.location).subtractV3(this.entity.location).normalize();
        this.entity.setRotation(direction.asRotation());
    }

    onEnter() {}

    onExit() {}

    onTick() {}

    triggerEvent(eventId: string) {
        this.entity.triggerEvent(`gm1_sky:${eventId}`);
    }

    runCommand(command: string) {
        this.entity.runCommand(command);
    }

    setSelectedItem(itemTypeId: string) {
        this.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${itemTypeId}`);
    }

    setOffhandItem(itemTypeId: string) {
        this.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${itemTypeId}`);
    }

    setArmorSet(helmetTypeId: string, chestplateTypeId: string, leggingsTypeId: string, bootsTypeId: string) {
        this.runCommand(`replaceitem entity @s slot.armor.head 0 ${helmetTypeId}`);
        this.runCommand(`replaceitem entity @s slot.armor.chest 0 ${chestplateTypeId}`);
        this.runCommand(`replaceitem entity @s slot.armor.legs 0 ${leggingsTypeId}`);
        this.runCommand(`replaceitem entity @s slot.armor.feet 0 ${bootsTypeId}`);
    }

    findBlock(volume: Volume, filter: (block: Block) => boolean) {
        const location = new V3(this.entity.location);
        volume = { min: location.addV3(volume.min), max: location.addV3(volume.max) };
        const blockLocations = V3.getBlocksInVolume(volume);

        for (const blockLocation of blockLocations) {
            const block = this.entity?.dimension.getBlock(blockLocation);
            if (block && filter(block)) {
                return block;
            }
        }
    }

    swingArm() {
        this.setProperty("gm1_sky:is_using_item", "swinging");
        this.timeout(() => {
            this.setProperty("gm1_sky:is_using_item", "idle");
        }, 1);
    }

    static playTrustUpParticle(entity: Entity) {
        entity.setProperty("gm1_sky:is_using_item", "trust_up");
        system.runTimeout(() => {
            entity.setProperty("gm1_sky:is_using_item", "idle");
        }, 3);
    }

    static playTrustDownParticle(entity: Entity) {
        entity.setProperty("gm1_sky:is_using_item", "trust_down");
        system.runTimeout(() => {
            entity.setProperty("gm1_sky:is_using_item", "idle");
        }, 3);
    }

    evaluateArmor() {
        const obtainedTiers = [
            EntityStore.get(this.entity!, "leatherObtained"),
            EntityStore.get(this.entity!, "ironObtained"),
            EntityStore.get(this.entity!, "diamondObtained"),
        ];

        const currentHeadTier = EntityStore.get(this.entity!, "armorTier0");
        const currentBodyTier = EntityStore.get(this.entity!, "armorTier1");
        const currentLegsTier = EntityStore.get(this.entity!, "armorTier2");
        const currentFeetTier = EntityStore.get(this.entity!, "armorTier3");

        let headTier = ArmorTier.None;
        let bodyTier = ArmorTier.None;
        let legsTier = ArmorTier.None;
        let feetTier = ArmorTier.None;

        for (let i = 0; i < obtainedTiers.length; i++) {
            const obtainedTier = obtainedTiers[i];

            if (obtainedTier >= 5) bodyTier = ArmorTierMap[i + 1] as ArmorTier;
            if (obtainedTier >= 9) legsTier = ArmorTierMap[i + 1] as ArmorTier;
            if (obtainedTier >= 13) headTier = ArmorTierMap[i + 1] as ArmorTier;
            if (obtainedTier >= 17) feetTier = ArmorTierMap[i + 1] as ArmorTier;
        }

        let headTierChanged = false;
        let bodyTierChanged = false;
        let legsTierChanged = false;
        let feetTierChanged = false;

        if (currentHeadTier !== headTier) {
            EntityStore.set(this.entity!, "armorTier0", headTier);
            this.setArmorTier(ArmorSlot.Head, headTier);
            headTierChanged = true;
        }
        if (currentBodyTier !== bodyTier) {
            EntityStore.set(this.entity!, "armorTier1", bodyTier);
            this.setArmorTier(ArmorSlot.Body, bodyTier);
            bodyTierChanged = true;
        }
        if (currentLegsTier !== legsTier) {
            EntityStore.set(this.entity!, "armorTier2", legsTier);
            this.setArmorTier(ArmorSlot.Legs, legsTier);
            legsTierChanged = true;
        }
        if (currentFeetTier !== feetTier) {
            EntityStore.set(this.entity!, "armorTier3", feetTier);
            this.setArmorTier(ArmorSlot.Feet, feetTier);
            feetTierChanged = true;
        }

        const itemTiersUsed = {
            [ArmorTier.None]: 0,
            [ArmorTier.Leather]: 0,
            [ArmorTier.Iron]: 0,
            [ArmorTier.Diamond]: 0,
        };
        if (headTierChanged) itemTiersUsed[bodyTier] = itemTiersUsed[bodyTier] + 5;
        if (bodyTierChanged) itemTiersUsed[legsTier] = itemTiersUsed[legsTier] + 4;
        if (legsTierChanged) itemTiersUsed[headTier] = itemTiersUsed[headTier] + 4;
        if (feetTierChanged) itemTiersUsed[feetTier] = itemTiersUsed[feetTier] + 4;

        let leatherToRemove = itemTiersUsed[ArmorTier.Leather];
        let ironToRemove = itemTiersUsed[ArmorTier.Iron];
        let diamondToRemove = itemTiersUsed[ArmorTier.Diamond];

        const allItems = InventoryUtil.getAllInventoryItems(this.entity!);
        for (const { itemStack, slot } of allItems) {
            if (leatherToRemove > 0 && GameData.ItemGroup["minecraft:leather"].includes(itemStack.typeId)) {
                if (itemStack.amount < leatherToRemove) InventoryUtil.setInventoryItem(this.entity, slot);
                else {
                    itemStack.amount -= leatherToRemove;
                    InventoryUtil.setInventoryItem(this.entity, slot, itemStack);
                }
                leatherToRemove -= itemStack.amount;
            } else if (ironToRemove > 0 && GameData.ItemGroup["minecraft:iron"].includes(itemStack.typeId)) {
                if (itemStack.amount < ironToRemove) InventoryUtil.setInventoryItem(this.entity, slot);
                else {
                    itemStack.amount -= ironToRemove;
                    InventoryUtil.setInventoryItem(this.entity, slot, itemStack);
                }
                ironToRemove -= itemStack.amount;
            } else if (diamondToRemove > 0 && GameData.ItemGroup["minecraft:diamond"].includes(itemStack.typeId)) {
                if (itemStack.amount < diamondToRemove) InventoryUtil.setInventoryItem(this.entity, slot);
                else {
                    itemStack.amount -= diamondToRemove;
                    InventoryUtil.setInventoryItem(this.entity, slot, itemStack);
                }
                diamondToRemove -= itemStack.amount;
            }
        }
    }

    static hasItemGroup(aiPlayer: Entity, groupKey: keyof typeof GameData.ItemGroup) {
        const items = InventoryUtil.getAllInventoryItems(aiPlayer);
        const typeIds = items.map((e) => e.itemStack.typeId);
        const group = GameData.ItemGroup[groupKey];
        return typeIds.some((typeId) => group.includes(typeId));
    }

    static hasUselessItem(aiPlayer: Entity) {
        const items = InventoryUtil.getAllInventoryItems(aiPlayer);
        const typeIds = items.map((e) => e.itemStack.typeId);
        const allItemWhitelist = [...GameData.AiPlayerItemWhitelist, ...AiPlayerWrapper.getHigherArmorList(aiPlayer)];
        const hasUselessItem = typeIds.some((typeId) => !allItemWhitelist.includes(typeId));
        return hasUselessItem;
    }

    hasUselessItem() {
        return AiPlayerWrapper.hasUselessItem(this.entity);
    }

    static hasWeapon(aiPlayer: Entity) {
        return this.hasItemGroup(aiPlayer, "minecraft:weapon");
    }

    hasWeapon() {
        return AiPlayerWrapper.hasWeapon(this.entity);
    }

    static hasAxe(aiPlayer: Entity) {
        return this.hasItemGroup(aiPlayer, "minecraft:axe");
    }

    hasAxe() {
        return AiPlayerWrapper.hasAxe(this.entity);
    }

    static hasFood(aiPlayer: Entity) {
        return this.hasItemGroup(aiPlayer, "minecraft:all_food");
    }

    hasFood() {
        return AiPlayerWrapper.hasFood(this.entity);
    }

    static hasPickaxe(aiPlayer: Entity) {
        return this.hasItemGroup(aiPlayer, "minecraft:pickaxe");
    }

    hasPickaxe() {
        return AiPlayerWrapper.hasPickaxe(this.entity);
    }

    static hasTorch(aiPlayer: Entity) {
        return this.hasItemGroup(aiPlayer, "minecraft:torch");
    }

    hasTorch() {
        return AiPlayerWrapper.hasTorch(this.entity);
    }

    setArmorTier(slot: ArmorSlot, tier: ArmorTier) {
        const itemTypeId = tier === ArmorTier.None ? "minecraft:air" : `minecraft:${tier}_${slot}`;
        const slotId = ArmorSlotCommandIdMap[slot];
        this.entity!.runCommand(`replaceitem entity @s slot.armor.${slotId} 0 ${itemTypeId}`);

        let armorTierType: "armorTier0" | "armorTier1" | "armorTier2" | "armorTier3" = "armorTier0";
        if (slot === ArmorSlot.Head) armorTierType = "armorTier0";
        else if (slot === ArmorSlot.Body) armorTierType = "armorTier1";
        else if (slot === ArmorSlot.Legs) armorTierType = "armorTier2";
        else if (slot === ArmorSlot.Feet) armorTierType = "armorTier3";
        EntityStore.set(this.entity!, armorTierType, tier);
    }

    static getCurrentArmor(aiPlayer: Entity): Record<ArmorSlot, ArmorTier> {
        return {
            [ArmorSlot.Head]: EntityStore.get(aiPlayer, "armorTier0"),
            [ArmorSlot.Body]: EntityStore.get(aiPlayer, "armorTier1"),
            [ArmorSlot.Legs]: EntityStore.get(aiPlayer, "armorTier2"),
            [ArmorSlot.Feet]: EntityStore.get(aiPlayer, "armorTier3"),
        };
    }

    static getOldAndNewArmorSlot(aiPlayer: Entity): {
        oldArmorSlot: Record<ArmorSlot, ArmorTier>;
        newArmorSlot: Record<ArmorSlot, ArmorTier>;
    } {
        const oldArmorSlot: Record<ArmorSlot, ArmorTier> = this.getCurrentArmor(aiPlayer);
        const newArmorSlot: Record<ArmorSlot, ArmorTier> = this.getCurrentArmor(aiPlayer);

        const validSlots = new Set(["helmet", "chestplate", "leggings", "boots"]);

        // find best armors
        const allItems = InventoryUtil.getAllInventoryItems(aiPlayer);
        for (const item of allItems) {
            if (!item || !item.itemStack.typeId) continue;
            const [tier, slot] = item.itemStack.typeId.replace("minecraft:", "").split("_");
            if (!validSlots.has(slot)) continue;

            const newTierValue = ArmorTierValueMap[tier];
            const currTierValue = ArmorTierValueMap[newArmorSlot[slot]];

            if (newTierValue > currTierValue) {
                newArmorSlot[slot] = tier;
            }
        }

        return { oldArmorSlot, newArmorSlot };
    }

    static getHigherArmorList(aiPlayer: Entity): string[] {
        const higherArmorList: string[] = [];
        const currentArmor = this.getCurrentArmor(aiPlayer);

        for (const slot of [ArmorSlot.Head, ArmorSlot.Body, ArmorSlot.Legs, ArmorSlot.Feet]) {
            const currentTier = currentArmor[slot];
            const currentTierValue = ArmorTierValueMap[currentTier];

            for (const tier of Object.keys(ArmorTierValueMap) as ArmorTier[]) {
                if (ArmorTierValueMap[tier] > currentTierValue) {
                    higherArmorList.push(`minecraft:${tier}_${slot}`);
                }
            }
        }

        return higherArmorList;
    }

    static hasBetterArmorThanEquipped(aiPlayer: Entity) {
        const { oldArmorSlot, newArmorSlot } = this.getOldAndNewArmorSlot(aiPlayer);

        for (const armorSlot of Object.values(ArmorSlot)) {
            if (ArmorTierValueMap[oldArmorSlot[armorSlot]] < ArmorTierValueMap[newArmorSlot[armorSlot]]) {
                return true;
            }
        }

        return false;
    }

    hasBetterArmorThanEquipped() {
        return AiPlayerWrapper.hasBetterArmorThanEquipped(this.entity);
    }

    setProperty<T extends keyof typeof properties>(property: T, value: (typeof properties)[T]["default"]) {
        this.entity.setProperty(property, value);
    }

    static getProperty<T extends keyof typeof properties>(aiPlayer: Entity, property: T) {
        return aiPlayer.getProperty(property) as (typeof properties)[T]["default"];
    }

    getProperty<T extends keyof typeof properties>(property: T) {
        return this.entity.getProperty(property) as (typeof properties)[T]["default"];
    }

    breakBlock(block: Block) {
        const location = new V3(block.location);
        const entity = EntityUtil.trySpawnEntity("gm1_sky:block_breaker", location.toGrid(), block.dimension);
        system.runTimeout(() => {
            block.dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
            if (EntityUtil.isValid(entity)) {
                entity.remove();
            }
        }, 2 * 20);
    }

    emitAction(action: AiPlayerAction) {
        GameData.events.emit("aiPlayerAction", this.entity, action);
    }

    static timeSince(timestamp: number) {
        return system.currentTick - timestamp;
    }

    timeSince(timestamp: number) {
        return system.currentTick - timestamp;
    }
}
