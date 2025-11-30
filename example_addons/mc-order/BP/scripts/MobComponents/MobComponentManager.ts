import { Dimension, Entity, system, Vector3, world } from "@minecraft/server";
import DebugTimer from "Utilities/DebugTimer";
import EntityUtil from "Utilities/EntityUtil";
import EventUtil from "Utilities/EventUtil";
import Runner from "Utilities/Runner";
import V3 from "Wrappers/V3";
import MobComponent from "./MobComponents/MobComponent";
import MobComponents from "./MobComponents/index";
import TemporaryEntities from "./TemporaryEntities";

enum CleanupTreatment {
    Keep,
    Destroy,
    Stall,
}

/**
 * MobComponentManager class to manage the registration and lifecycle of MobComponents.
 *
 * Responsibilities:
 * - Registers MobComponents with their associated entity types.
 * - Subscribes to various world events to handle entity registration.
 * - Manages pre-existing entities and sets up periodic cleanup tasks.
 */
export default class MobComponentManager {
    private static readonly MaxDistanceToPlayer = 128;
    private static componentsToRegister: { entityTypes: string[]; component: (typeof MobComponents)[number] }[] = [];
    private static entityTypeIdsToRegister: Set<string> = new Set();
    static mobComponents: { [key: string]: MobComponent[] } = {};
    private static entityIdsRegistered: Set<string> = new Set();
    private static stalledEntities: Set<{ entity: Entity; location: V3 }> = new Set();

    static init() {
        for (const MobComponent of MobComponents) {
            this.componentsToRegister.push({ entityTypes: MobComponent.EntityTypes, component: MobComponent });
            this.entityTypeIdsToRegister = new Set([...this.entityTypeIdsToRegister, ...MobComponent.EntityTypes]);
        }

        EventUtil.subscribe("WorldAfterEvents", "playerSpawn", ({ player }) => this.register(player));
        EventUtil.subscribe("WorldAfterEvents", "entitySpawn", ({ entity }) => this.register(entity));
        EventUtil.subscribe("WorldAfterEvents", "entityLoad", ({ entity }) => this.registerPreExisting(entity));
        [...world.getDimension("overworld").getEntities()].forEach((entity) => this.registerPreExisting(entity));

        Runner.interval(() => {
            this.checkStalledEntities();
        }, 30);
        Runner.interval(() => this.cleanup(), 10);
    }

    static registerPreExisting(entity: Entity) {
        const entityId = entity.typeId;
        if (TemporaryEntities.includes(entityId)) {
            try {
                entity.remove();
            } catch (e) {}
            return;
        }
        this.register(entity, true);
    }

    static register(entity: Entity, preExisting = false, skipStallCheck?: boolean) {
        if (!EntityUtil.isValid(entity)) return;
        if (!this.entityTypeIdsToRegister.has(entity.typeId)) return;
        if (this.entityIdsRegistered.has(entity.id)) return;

        if (!skipStallCheck && this.getCleanupTreatment(entity, entity.id, true) === CleanupTreatment.Stall) {
            this.stalledEntities.add({ entity, location: new V3(entity.location) });
            return;
        }

        this.entityIdsRegistered.add(entity.id);

        this.mobComponents[entity.id] = [];
        for (const { entityTypes, component } of this.componentsToRegister) {
            if (entityTypes.includes(entity.typeId)) {
                const componentInstance = new component(entity, undefined, preExisting);
                this.mobComponents[entity.id].push(componentInstance);
            }
        }
    }

    static isWithinRange(location: Vector3, dimension: Dimension, playerLocations?: { location: Vector3; dimension: Dimension }[]) {
        // return PlayersCache.getDistanceToClosestPlayer(location) <= this.MaxDistanceToPlayer;

        if (playerLocations) {
            let nearestDistance = Infinity;
            for (const playerLocation of playerLocations) {
                if (playerLocation.dimension.id !== dimension.id) continue;

                const distance = V3.distance(location, playerLocation.location);
                if (distance < nearestDistance) nearestDistance = distance;
            }

            return nearestDistance <= this.MaxDistanceToPlayer;
        }

        const nearestPlayer = EntityUtil.getNearestPlayer(location, dimension, this.MaxDistanceToPlayer);
        return !!nearestPlayer;
    }

    static wait(time: number) {
        return new Promise<void>((resolve) => system.runTimeout(() => resolve(), time));
    }

    static async checkStalledEntities() {
        const players = world.getPlayers().map((player) => ({ location: new V3(player.location), dimension: player.dimension }));
        for (let i = 0; i < this.stalledEntities.size; i++) {
            const entry = [...this.stalledEntities][i];

            if (i % 10 === 0) await this.wait(0);
            const isValid = EntityUtil.isValid(entry.entity);
            if (!isValid) {
                this.stalledEntities.delete(entry);
                continue;
            }

            const isWithinRange = this.isWithinRange(entry.location, entry.entity.dimension, players);
            if (!isWithinRange) continue;

            this.register(entry.entity, false, true);
            this.stalledEntities.delete(entry);
        }
    }

    static cleanup() {
        DebugTimer.countStart("MCM.cleanup");
        for (const entityId in this.mobComponents) {
            const entity = this.mobComponents[entityId]?.[0]?.entity || world.getEntity(entityId);
            const treatment = this.getCleanupTreatment(entity, entityId);
            if (treatment === CleanupTreatment.Stall) {
                this.stalledEntities.add({ entity: entity!, location: new V3(entity!.location) });
            }

            if (treatment !== CleanupTreatment.Keep) {
                for (const component of this.mobComponents[entityId]) {
                    component.destroy();
                }
                delete this.mobComponents[entityId];
                this.entityIdsRegistered.delete(entityId);
            }
        }
        DebugTimer.countEnd();
    }

    static getCleanupTreatment(entity: Entity | undefined, entityId: string, skipIsValidCheck?: boolean) {
        if (!skipIsValidCheck && !EntityUtil.isValid(entity)) return CleanupTreatment.Destroy;

        const entityTypeId = this.mobComponents[entityId]?.[0]?.entityTypeId || entity!.typeId;
        if (entityTypeId == "minecraft:player") return CleanupTreatment.Keep;

        if (!this.isWithinRange(entity!.location, entity!.dimension)) return CleanupTreatment.Stall;

        return CleanupTreatment.Keep;
    }

    static countRegisteredComponents() {
        const count = {};
        for (const entityId in this.mobComponents) {
            count[entityId] = this.mobComponents[entityId].length;
        }
        return JSON.stringify(count);
    }

    static countRegisteredEntities() {
        const count = {};
        for (const entityId in this.mobComponents) {
            const typeId = this.mobComponents[entityId][0].entityTypeId;
            if (count[typeId]) count[typeId]++;
            else count[typeId] = 1;
        }

        const sorted = Object.keys(count).sort((a, b) => count[b] - count[a]);
        const sortedCount = {};
        for (const key of sorted) {
            sortedCount[key] = count[key];
        }

        const total = Object.keys(count).reduce((acc, key) => acc + count[key], 0);

        return `${JSON.stringify({ total, ...sortedCount })}`;
    }

    static getInstanceOfComponent<T extends MobComponent>(component: { new (...args: unknown[]): T }, entity: Entity): T {
        return this.getInstancesOfComponent(component, [entity])[0];
    }

    static getInstancesOfComponent<T extends MobComponent>(component: { new (...args: unknown[]): T }, entities?: Entity[]): T[] {
        const instances: T[] = [];

        let entityIds = Object.keys(this.mobComponents);
        if (entities) entityIds = entities.map((entity) => entity.id);

        for (const entityId of entityIds) {
            if (this.mobComponents[entityId] === undefined) continue;
            for (const mobComponent of this.mobComponents[entityId]) {
                if (mobComponent instanceof component) instances.push(mobComponent as T);
            }
        }

        return instances;
    }
}

// system.runInterval(() => {
//     // const entities = EntityUtil.getEntities({});
//     // let text = "";
//     // // make a text of entityName: count
//     // const lengths = entities.reduce((acc, entity) => {
//     //     acc[entity.typeId] = (acc[entity.typeId] || 0) + 1;
//     //     return acc;
//     // }, {});

//     // const total = entities.length;
//     // text += `Total: ${total}\n`;

//     // for (let i = 1; i < Object.keys(lengths).length; i++) {
//     //     const entityName = Object.keys(lengths)[i];
//     //     const count = Object.values(lengths)[i];
//     //     text += `${entityName}: ${count} `;
//     //     if (i % 3 === 0) text += "\n";
//     // }

//     let text = MobComponentManager.countRegisteredEntities();
//     const textArr = text.split(",");
//     // replace every 3rd . with \n
//     const newTextArr: string[] = [];
//     for (let i = 0; i < textArr.length; i++) {
//         newTextArr.push(textArr[i]);
//         if ((i + 1) % 3 === 0) newTextArr.push("\n");
//     }
//     text = newTextArr.join(",");

//     BroadcastUtil.actionbar(text);
// }, 20);
