import { Entity, system } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import { PersistentProperties, TemporaryProperties } from "./Properties";

type ArrayType<Key extends keyof typeof PersistentProperties = keyof typeof PersistentProperties> =
    Key extends keyof typeof PersistentProperties ? ((typeof PersistentProperties)[Key] extends Array<unknown> ? Key : never) : never;

export default class EntityStore {
    private static temporaryStorage = new Map<
        Entity,
        Map<keyof typeof TemporaryProperties, (typeof TemporaryProperties)[keyof typeof TemporaryProperties]>
    >();
    private static persistentStorage = new Map<
        Entity,
        Map<keyof typeof PersistentProperties, (typeof PersistentProperties)[keyof typeof PersistentProperties]>
    >();

    static init() {
        system.runInterval(() => this.temporaryStorageGC(), 2 * 20);
    }

    static get<Type extends keyof typeof PersistentProperties>(entity: Entity, key: Type): (typeof PersistentProperties)[Type] {
        const entityMap = EntityStore.persistentStorage.get(entity);
        const onCacheMiss = (
            entityMap: Map<keyof typeof PersistentProperties, (typeof PersistentProperties)[keyof typeof PersistentProperties]>
        ) => {
            const valueSaved = entity.getDynamicProperty(key) as (typeof PersistentProperties)[Type];
            if (valueSaved === undefined) {
                const defaultValue = PersistentProperties[key];
                entityMap.set(key, defaultValue);

                const valueToSet = Array.isArray(defaultValue) ? JSON.stringify(defaultValue) : (defaultValue as string);
                entity.setDynamicProperty(key, valueToSet);

                return defaultValue;
            } else {
                const defaultValue = PersistentProperties[key];
                const value = Array.isArray(defaultValue) ? JSON.parse(valueSaved as string) : valueSaved;
                entityMap.set(key, value);
                return value as (typeof PersistentProperties)[Type];
            }
        };

        if (entityMap === undefined) {
            const newEntityMap = new Map<
                keyof typeof PersistentProperties,
                (typeof PersistentProperties)[keyof typeof PersistentProperties]
            >();
            EntityStore.persistentStorage.set(entity, newEntityMap);
            return onCacheMiss(newEntityMap);
        } else {
            const entityMapValue = entityMap.get(key);
            if (entityMapValue === undefined) {
                return onCacheMiss(entityMap);
            } else {
                return entityMapValue as (typeof PersistentProperties)[Type];
            }
        }
    }

    static set<Type extends keyof typeof PersistentProperties>(entity: Entity, key: Type, value: (typeof PersistentProperties)[Type]) {
        const entityMap = EntityStore.persistentStorage.get(entity);
        if (entityMap === undefined) {
            const newEntityMap = new Map<
                keyof typeof PersistentProperties,
                (typeof PersistentProperties)[keyof typeof PersistentProperties]
            >();
            EntityStore.persistentStorage.set(entity, newEntityMap);
            newEntityMap.set(key, value);

            const valueToSet = Array.isArray(value) ? JSON.stringify(value) : (value as string);
            entity.setDynamicProperty(key, valueToSet);
        } else {
            entityMap.set(key, value);

            const valueToSet = Array.isArray(value) ? JSON.stringify(value) : (value as string);
            entity.setDynamicProperty(key, valueToSet);
        }
    }

    static setOwner(entity: Entity, owner: Entity) {
        entity.setDynamicProperty("linkedOwnerId", owner.id);
        EntityStore.pushToArray(owner, "linkedChildrenIds", entity.id);
    }

    static getOwner(entity: Entity) {
        const ownerId = this.get(entity, "linkedOwnerId");
        if (ownerId === undefined) return undefined;

        return EntityUtil.getEntityById(ownerId);
    }

    static linkEntities(entity1: Entity, entity2: Entity) {
        this.set(entity1, "linkedEntityId", entity2.id);
        this.set(entity2, "linkedEntityId", entity1.id);
    }

    static getLinkedEntity(entity: Entity) {
        const linkedEntityId = this.get(entity, "linkedEntityId");
        if (linkedEntityId.length) return EntityUtil.getEntityById(linkedEntityId);
        return undefined;
    }

    static isInArray<Key extends ArrayType>(entity: Entity, key: Key, value: (typeof PersistentProperties)[Key][0]) {
        const array = this.get(entity, key) as (typeof PersistentProperties)[Key][0][];
        return array.includes(value);
    }

    static pushToArray<Key extends ArrayType>(entity: Entity, key: Key, value: (typeof PersistentProperties)[Key][0], unique = true) {
        const array = this.get(entity, key) as (typeof PersistentProperties)[Key][0][];
        if (unique && array.includes(value)) return;
        array.push(value);
        this.set(entity, key, array as (typeof PersistentProperties)[Key]);
    }

    static removeFromArray<Key extends ArrayType>(entity: Entity, key: Key, value: (typeof PersistentProperties)[Key][0]) {
        const array = this.get(entity, key) as (typeof PersistentProperties)[Key][0][];
        const index = array.indexOf(value);
        if (index === -1) return;
        array.splice(index, 1);
        this.set(entity, key, array as (typeof PersistentProperties)[Key]);
    }

    static temporary = {
        get<Type extends keyof typeof TemporaryProperties>(entity: Entity, key: Type): (typeof TemporaryProperties)[Type] {
            const entityMap = EntityStore.temporaryStorage.get(entity);
            if (entityMap === undefined) {
                const newEntityMap = new Map<
                    keyof typeof TemporaryProperties,
                    (typeof TemporaryProperties)[keyof typeof TemporaryProperties]
                >();
                EntityStore.temporaryStorage.set(entity, newEntityMap);
                return TemporaryProperties[key];
            }

            if (!entityMap.has(key)) entityMap.set(key, TemporaryProperties[key]);
            return entityMap.get(key) as (typeof TemporaryProperties)[Type];
        },

        set<Type extends keyof typeof TemporaryProperties>(entity: Entity, key: Type, value: (typeof TemporaryProperties)[Type]) {
            const entityMap = EntityStore.temporaryStorage.get(entity);
            if (entityMap === undefined) {
                const newEntityMap = new Map<
                    keyof typeof TemporaryProperties,
                    (typeof TemporaryProperties)[keyof typeof TemporaryProperties]
                >();
                EntityStore.temporaryStorage.set(entity, newEntityMap);
                newEntityMap.set(key, value);
                return;
            }

            entityMap.set(key, value);
        },
    };

    private static temporaryStorageGC() {
        for (const [entity] of this.temporaryStorage) {
            if (!EntityUtil.isValid(entity)) this.temporaryStorage.delete(entity);
        }
        for (const [entity] of this.persistentStorage) {
            if (!EntityUtil.isValid(entity)) this.persistentStorage.delete(entity);
        }
    }
}
