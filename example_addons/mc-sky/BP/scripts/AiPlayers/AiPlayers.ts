import { Dimension, system, world } from "@minecraft/server";
import Main from "Main";
import AiPlayer, { SerializedAiPlayer } from "MobComponents/MobComponents/AiPlayer";
import EntityStore from "Store/Entity/EntityStore";
import WorldStore from "Store/World/WorldStore";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import PlayersCache from "Wrappers/PlayersCache";
import V3 from "Wrappers/V3";

export default class {
    static readonly LeaveChance = (age: number) => {
        if (age < 2 * 60 * 20) return 0;
        if (age < 5 * 60 * 20) return 0.2;
        if (age < 10 * 60 * 20) return 0.4;
        if (age < 20 * 60 * 20) return 0.6;
        if (age < 30 * 60 * 20) return 0.8;
        return 1;
    };
    static readonly LeaveDuration = () => 2 * 60 * 20 * MathUtil.random(0.33, 3);

    static init() {
        const serializedAiPlayers = WorldStore.get("SerializedAiPlayers");
        for (let i = 0; i < serializedAiPlayers.length; i++) {
            const aiData = JSON.parse(serializedAiPlayers[i]) as SerializedAiPlayer;
            aiData.seriaizeTimestamp = system.currentTick;
            serializedAiPlayers[i] = JSON.stringify(aiData);
        }
        WorldStore.set("SerializedAiPlayers", serializedAiPlayers);

        world.afterEvents.entitySpawn.subscribe((eventData) => {
            if (eventData.entity.typeId == "minecraft:item") {
                try {
                    eventData.entity.addTag("item");
                } catch {
                    return;
                }
                const nearestPlayerToItem = EntityUtil.getNearestPlayer(eventData.entity.location, eventData.entity.dimension, [0, 10]);
                if (nearestPlayerToItem) {
                    EntityStore.temporary.set(eventData.entity, "owner", nearestPlayerToItem);
                }
                return;
            }
        });

        world.beforeEvents.entityRemove.subscribe((eventData) => {
            if (eventData.removedEntity.typeId !== "minecraft:item") return;
            const location = new V3(eventData.removedEntity.location);
            const owner = EntityStore.temporary.get(eventData.removedEntity, "owner");

            system.run(() => {
                if (!owner || !EntityUtil.isValid(owner)) return;

                const aiPlayerPickedUp = EntityUtil.getEntities(
                    { closest: 1, location: location, type: "gm1_sky:ai_player", maxDistance: 3 },
                    owner.dimension
                )[0];
                if (!aiPlayerPickedUp) return;

                AiPlayer.addTrustLongTerm(aiPlayerPickedUp, owner, 20);
                // console.warn(`AiPlayer ${EntityStore.get(aiPlayerPickedUp, "name")} picked up item from ${owner.name}`);
            });
        });

        system.runInterval(() => this.checkSpawn(), 40);
    }

    static checkSpawn() {
        const spawnPoint = new V3(world.getDefaultSpawnLocation());

        const shouldBeTicking = PlayersCache.players.some(
            (p) => V3.distanceFlat(p.location, spawnPoint) < 40 && p.dimension.id == Main.overworld.id
        );

        if (!shouldBeTicking) return;
        const topBlock = Main.overworld.getTopmostBlock(spawnPoint);
        if (!topBlock || !topBlock.isValid()) return;
        const aboveTopBlock = new V3(topBlock.location).add(0, 1, 0);
        this.tryRespawn(aboveTopBlock, Main.overworld);
    }

    static tryRespawn(location: V3, dimension: Dimension) {
        const serializedAiPlayers = WorldStore.get("SerializedAiPlayers");

        const currentAiCount = EntityUtil.getEntitiesGlobal({ type: "gm1_sky:ai_player" }).length;
        const maxAiCount = WorldStore.get("AiPlayerMaxCount");

        if (currentAiCount >= maxAiCount) return;

        for (const serializedAiPlayer of serializedAiPlayers) {
            const aiData = JSON.parse(serializedAiPlayer) as SerializedAiPlayer;

            // if (aiData.hasLeft && MathUtil.timeSince(aiData.seriaizeTimestamp) < this.LeaveDuration()) {
            //     continue;
            // }

            const registeredBedIdList = WorldStore.get("RegisteredBedIdList");
            let respawnLocation = location;

            for (const bedId of registeredBedIdList) {
                const aiBedEntity = EntityUtil.getEntityById(bedId);
                if (aiBedEntity && aiBedEntity.nameTag === aiData.name) {
                    respawnLocation = new V3(aiBedEntity.location.x, aiBedEntity.location.y + 1, aiBedEntity.location.z);
                    break;
                }
            }

            this.respawnPlayer(aiData, respawnLocation, dimension);
            return;
        }

        EntityUtil.spawnEntity("gm1_sky:ai_player", location, dimension);
    }

    static respawnPlayer(aiData: SerializedAiPlayer, location: V3, dimension: Dimension) {
        // console.warn("name from serial: ", aiData.name);
        const entity = EntityUtil.spawnEntity("gm1_sky:ai_player", location, dimension);
        EntityStore.set(entity, "name", aiData.name);
        EntityStore.set(entity, "trust", JSON.stringify(aiData.trust));
        EntityStore.set(entity, "trustLongTerm", JSON.stringify(aiData.trustLongTerm));
        EntityStore.set(entity, "bodytypeSkin", aiData.properties.bodytype);
        EntityStore.set(entity, "baseSkin", aiData.properties.base);
        EntityStore.set(entity, "shirtSkin", aiData.properties.shirt);
        EntityStore.set(entity, "pantsSkin", aiData.properties.pants);
        EntityStore.set(entity, "eyesSkin", aiData.properties.eyes);
        EntityStore.set(entity, "eyesColorSkin", aiData.properties.eyes_color);
        EntityStore.set(entity, "mouthSkin", aiData.properties.mouth);
        EntityStore.set(entity, "mouthColorSkin", aiData.properties.mouth_color);
        EntityStore.set(entity, "hairSkin", aiData.properties.hair);
        EntityStore.set(entity, "hairColorSkin", aiData.properties.hair_color);
        EntityStore.set(entity, "deaths", aiData.deaths);
        EntityStore.set(entity, "monstersKilled", aiData.monstersKilled);
        EntityStore.set(entity, "woodObtained", aiData.woodObtained);
        EntityStore.set(entity, "stoneObtained", aiData.stoneObtained);
        EntityStore.set(entity, "ironObtained", aiData.ironObtained);
        EntityStore.set(entity, "diamondObtained", aiData.diamondObtained);
        EntityStore.set(entity, "leatherObtained", aiData.leatherObtained);
        EntityStore.set(entity, "lastDeathTick", aiData.lastDeathTick);
        EntityStore.set(entity, "lastLogoutTick", aiData.lastLogoutTick);
        EntityStore.set(entity, "firstLoginTick", aiData.firstLoginTick);
        EntityStore.set(entity, "lastLoginTick", aiData.lastLoginTick);
        EntityStore.set(entity, "armorTier0", aiData.armorTier0);
        EntityStore.set(entity, "armorTier1", aiData.armorTier1);
        EntityStore.set(entity, "armorTier2", aiData.armorTier2);
        EntityStore.set(entity, "armorTier3", aiData.armorTier3);
        EntityStore.set(entity, "assignedAiBedEntityId", aiData.assignedAiBedEntityId);
        for (const [propertyKey, propertyValue] of Object.entries(aiData.properties)) {
            entity.setProperty("gm1_sky:" + propertyKey, propertyValue);
        }

        EntityStore.set(entity, "lastRelocateTick", system.currentTick);
        if (aiData.died) EntityStore.set(entity, "lastRespawnTick", system.currentTick);

        this.removeFromSerializedAiPlayers(aiData.name);
    }

    static removeFromSerializedAiPlayers(aiPlayerName: string) {
        const serializedAiPlayers = WorldStore.get("SerializedAiPlayers");
        const newSerializedAiPlayers = serializedAiPlayers.filter((serializedAiPlayer) => {
            const aiData = JSON.parse(serializedAiPlayer) as SerializedAiPlayer;
            return aiData.name !== aiPlayerName;
        });
        WorldStore.set("SerializedAiPlayers", newSerializedAiPlayers);
    }

    static aiPlayersCount() {
        const aiPlayers = EntityUtil.getEntitiesGlobal({ type: "gm1_sky:ai_player" });
        const serializedAiPlayers = WorldStore.get("SerializedAiPlayers");
        return aiPlayers.length + serializedAiPlayers.length;
    }

    static setAiPlayerMaxCount(maxCount: number) {
        WorldStore.set("AiPlayerMaxCount", maxCount);

        const aiPlayers = EntityUtil.getEntitiesGlobal({ type: "gm1_sky:ai_player" });
        if (aiPlayers.length > maxCount) {
            for (let i = maxCount; i < aiPlayers.length; i++) {
                AiPlayer.serialize(aiPlayers[i], false, true);
            }
        }
    }

    static isSessionActive() {
        return this.aiPlayersCount() > 0;
    }
}
