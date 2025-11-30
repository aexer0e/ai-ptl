import { Dimension, DimensionTypes, Entity, system, Vector3, world } from "@minecraft/server";
import TemporaryEntities from "../Game/TemporaryEntities";
import MobComponent from "./MobComponents/MobComponent";
import MobComponents from "./MobComponents/index";

export type MobComponentKey = keyof typeof MobComponents;
export type MobComponentInstance<T extends MobComponentKey> = InstanceType<(typeof MobComponents)[T]> | undefined;

export default class MobComponentManager {
    private static readonly MaxDistanceToPlayer = 64;
    private static componentsToRegister: { entityTypes: string[]; component: typeof MobComponent; name: string }[] = [];
    private static entityTypeIdsToRegister: Set<string> = new Set();
    private static entityIdsRegistered: Set<string> = new Set();
    private static stalledEntities: Set<{ entity: Entity; location: V3; dimension: Dimension }> = new Set();
    static mobComponents: { [key: string]: { [key in MobComponentKey]?: MobComponentInstance<key> } } = {};

    static init() {
        for (const MobComponentKey in MobComponents) {
            const MobComponent = MobComponents[MobComponentKey] as typeof MobComponent;
            this.componentsToRegister.push({ entityTypes: MobComponent.EntityTypes, component: MobComponent, name: MobComponentKey });
            this.entityTypeIdsToRegister = new Set([...this.entityTypeIdsToRegister, ...MobComponent.EntityTypes]);
        }

        EventSubscriber.subscribe("WorldAfterEvents", "playerSpawn", ({ player }) => this.register(player));
        EventSubscriber.subscribe("WorldAfterEvents", "entitySpawn", ({ entity }) => this.register(entity));
        EventSubscriber.subscribe("WorldAfterEvents", "entityLoad", ({ entity }) => this.registerPreExisting(entity));
        DimensionTypes.getAll().forEach((dimensionType) => {
            const entities = world.getDimension(dimensionType.typeId).getEntities();
            entities.forEach((entity) => this.registerPreExisting(entity));
        });

        system.runInterval(() => {
            this.checkStalledEntities();
        }, 30);
        system.runInterval(() => this.cleanup(), 10);
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

    static register(entity: Entity, preExisting = false, isWithinRange?: boolean) {
        if (!EntityUtil.isValid(entity)) return;
        if (!this.entityTypeIdsToRegister.has(entity.typeId)) return;
        if (this.entityIdsRegistered.has(entity.id)) return;

        if (isWithinRange === undefined) isWithinRange = this.isWithinRange(entity.location, entity.dimension);

        if (!isWithinRange && entity.typeId !== "minecraft:player") {
            this.stalledEntities.add({ entity, location: new V3(entity.location), dimension: entity.dimension });
            return;
        }

        this.entityIdsRegistered.add(entity.id);

        this.mobComponents[entity.id] = {};
        for (const { entityTypes, component } of this.componentsToRegister) {
            if (entityTypes.includes(entity.typeId)) {
                const componentInstance = new component(entity, undefined, preExisting);
                this.mobComponents[entity.id][component.name] = componentInstance;
            }
        }

        GameData.events.emit("EntityLoaded", entity);
    }

    static isWithinRange(location: Vector3, dimension: Dimension) {
        return PlayersCache.getDistanceToClosestPlayer(location, dimension) <= this.MaxDistanceToPlayer;
    }

    static wait(time: number) {
        return new Promise<void>((resolve) => system.runTimeout(() => resolve(), time));
    }

    static async checkStalledEntities() {
        for (let i = 0; i < this.stalledEntities.size; i++) {
            const entry = [...this.stalledEntities][i];

            if (i % 10 === 0) await this.wait(0);
            const isValid = EntityUtil.isValid(entry.entity);
            if (!isValid) {
                this.stalledEntities.delete(entry);
                continue;
            }

            const isWithinRange = this.isWithinRange(entry.location, entry.dimension);
            if (!isWithinRange) continue;

            this.register(entry.entity, false, true);
            this.stalledEntities.delete(entry);
        }
    }

    static cleanup() {
        DebugTimer.countStart("MCM.cleanup");
        for (const entityId in this.mobComponents) {
            const entity = world.getEntity(entityId);

            let shouldDestroy = false;
            let shouldStall = false;

            DebugTimer.countStart("MCM.cleanup.isValid");
            if (!entity?.valid()) {
                shouldDestroy = true;
            } else if (entity.typeId !== "minecraft:player") {
                const location = this.mobComponents[entityId][0]?.entityLocation || entity.location;
                shouldStall = !this.isWithinRange(location, entity.dimension);
            }
            DebugTimer.countEnd();

            if (shouldStall) {
                this.stalledEntities.add({ entity: entity!, location: new V3(entity!.location), dimension: entity!.dimension });
            }
            if (shouldDestroy || shouldStall) {
                for (const component in this.mobComponents[entityId]) {
                    const instance = this.mobComponents[entityId][component];
                    instance.destroy();
                }
                delete this.mobComponents[entityId];
                this.entityIdsRegistered.delete(entityId);
            }
        }
        DebugTimer.countEnd();
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

    static getMobComponentOfEntity<T extends MobComponentKey>(entity: Entity, mobComponentKey: T): MobComponentInstance<T> | undefined {
        return this.mobComponents[entity.id]?.[mobComponentKey];
    }

    static getMobComponentInstances<T extends MobComponentKey>(mobComponentKey: T, entities?: Entity[]): MobComponentInstance<T>[] {
        const instances: MobComponentInstance<T>[] = [];

        let entityIds: string[];
        if (entities) entityIds = entities.map((entity) => entity.id);
        else entityIds = Object.keys(this.mobComponents);

        for (const entityId of entityIds) {
            const instance = this.mobComponents[entityId]?.[mobComponentKey];
            if (instance) instances.push(instance);
        }

        return instances;
    }
}
