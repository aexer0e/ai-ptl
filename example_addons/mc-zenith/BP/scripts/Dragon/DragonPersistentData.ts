import { EntityHealthComponent, EntityTameableComponent, Player, system } from "@minecraft/server";
import MobComponentManager from "MobComponents/MobComponentManager";
import V3 from "Wrappers/V3";

export interface DragonPersistentDataEntry {
    version: number;
    ownerId: string;
    isSaddled: boolean;
    hasArmor: boolean;
    trust: number;
    nameTag: string;
    typeId: string;
    entityId: string;
    id: number; // This is the custom dragon persistence ID, not the entity ID
    health?: number; // If manually unsummoned
    stamina?: number; // If manually unsummoned
    deathTick?: number; // If the dragon died
}

export default class DragonPersistentData {
    private static dragonPersistentDataMap: DragonPersistentDataEntry[] = [];
    private static dataChanged = false;

    static init() {
        this.dragonPersistentDataMap = JSON.parse(WorldStore.get("DragonPersistentDataMap"));
        system.runInterval(() => {
            if (this.dataChanged) this.serializeCache();
        }, 15);
    }

    static getPersistentData(dragonPersistenceId: number): DragonPersistentDataEntry | null {
        const data = this.dragonPersistentDataMap.find((entry) => entry.id === dragonPersistenceId);
        if (data) {
            return data;
        } else {
            return null;
        }
    }

    static addPersistentData(entityId: string, data: DragonPersistentDataEntry) {
        if (this.dragonPersistentDataMap.find((entry) => entry.entityId === entityId)) {
            console.warn(`Persistent data for entity ID ${entityId} already exists. Use updatePersistentData instead.`);
            return;
        }
        this.dragonPersistentDataMap.push(data);
        WorldStore.set("NextPersistentDragonId", data.id + 1);
        this.serializeCache();
    }

    static updatePersistentData(entityId: string, data: Partial<DragonPersistentDataEntry>) {
        const existingData = this.dragonPersistentDataMap.find((entry) => entry.entityId === entityId);
        if (existingData) {
            const valuesHaveChanged = !Object.keys(data).every((key) => {
                data[key] == existingData[key];
            });
            if (valuesHaveChanged) {
                Object.assign(existingData, data);
                this.dataChanged = true;
            }
        } else {
            console.warn(`No persistent data found for entity ID: ${entityId}`);
        }
    }

    static getOwnedDragons(playerId: string): DragonPersistentDataEntry[] {
        const ownedDragons: DragonPersistentDataEntry[] = [];
        for (const entry of this.dragonPersistentDataMap) {
            if (entry.ownerId === playerId) {
                ownedDragons.push(entry);
            }
        }
        return ownedDragons;
    }

    static removePersistentData(dragonPersistenceId: number) {
        const index = this.dragonPersistentDataMap.findIndex((entry) => entry.id === dragonPersistenceId);
        if (index === -1) {
            console.warn(`No persistent data found for dragon ID: ${dragonPersistenceId}`);
            return;
        }

        this.dragonPersistentDataMap.splice(index, 1);
        this.serializeCache();
    }

    static summonDragon(dragonPersistenceId: number, owner: Player) {
        const existingData = this.dragonPersistentDataMap.find((entry) => entry.id === dragonPersistenceId);
        if (!existingData) {
            console.warn(`No persistent data found for dragon ID: ${dragonPersistenceId}`);
            return;
        }

        let dragon = EntityUtil.getEntityById(existingData.entityId);
        const locationToSummon = new V3(owner.location).addV3(new V3(owner.getViewDirection()).setY(0).normalize().multiply(3.5));
        const locationToSummonBackup = new V3(owner.location).add(0, 1, 0);
        if (!dragon) {
            dragon = EntityUtil.spawnEntity(`${existingData.typeId}<gm1_zen:as_tame>`, locationToSummonBackup, owner.dimension);
            dragon.teleport(locationToSummon, { checkForBlocks: true });

            dragon.nameTag = existingData.nameTag;

            EntityStore.set(dragon, "Trust", existingData.trust);
            EntityStore.set(dragon, "EntityVersion", existingData.version + 1);
            EntityStore.set(dragon, "PersistentDragonId", existingData.id);

            dragon.setProperty("gm1_zen:is_saddled", existingData.isSaddled);
            dragon.setProperty("gm1_zen:has_armor", existingData.hasArmor);

            const tameableComponent = dragon.getComponent(EntityTameableComponent.componentId) as EntityTameableComponent;
            tameableComponent.tame(owner);

            if (existingData.health) {
                const healthComponent = dragon.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
                healthComponent.resetToMaxValue();
            }

            existingData.version += 1;
            existingData.entityId = dragon.id;
        } else {
            dragon.teleport(locationToSummonBackup);
            dragon.teleport(locationToSummon, { checkForBlocks: true });
            MobComponentManager.forceUnstallEntity(dragon);
        }
    }

    static nightfuryExists(exceptEntityId?: string) {
        const nightfuriesInWorld = MobComponentManager.getMobComponentInstances("Nightfury");
        if (nightfuriesInWorld.length > 0) {
            if (!exceptEntityId || nightfuriesInWorld.length != 1 || nightfuriesInWorld[0]!.entity.id !== exceptEntityId) {
                return true;
            }
        }

        const nightfuriesInPersistentData = this.dragonPersistentDataMap.filter((entry) => entry.typeId === "gm1_zen:nightfury");
        if (nightfuriesInPersistentData.length > 0) {
            if (!exceptEntityId || nightfuriesInPersistentData.length != 1 || nightfuriesInPersistentData[0]!.entityId !== exceptEntityId) {
                return true;
            }
        }

        return false;
    }

    static clearAllPersistentData() {
        this.dragonPersistentDataMap = [];
        WorldStore.set("DragonPersistentDataMap", JSON.stringify(this.dragonPersistentDataMap));
        this.dataChanged = false;
    }

    private static serializeCache() {
        WorldStore.set("DragonPersistentDataMap", JSON.stringify(this.dragonPersistentDataMap));
        this.dataChanged = false;
    }
}
