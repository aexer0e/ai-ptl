import { Entity, EntityQueryOptions, system } from "@minecraft/server";
import { PersistentProperties, TemporaryProperties } from "./Properties";

type ArrayType<Key extends keyof typeof PersistentProperties = keyof typeof PersistentProperties> =
    Key extends keyof typeof PersistentProperties ? ((typeof PersistentProperties)[Key] extends Array<unknown> ? Key : never) : never;

// get the keys of a type, eg keys that are a string
type PropertKeyOfType<Type> = {
    [Key in keyof typeof PersistentProperties]: (typeof PersistentProperties)[Key] extends Type ? Key : never;
}[keyof typeof PersistentProperties];

class _EntityStore {
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
        DebugTimer.countStart("EntityStore.get");
        const entityMap = this.persistentStorage.get(entity);
        const onCacheMiss = (
            entityMap: Map<keyof typeof PersistentProperties, (typeof PersistentProperties)[keyof typeof PersistentProperties]>
        ) => {
            const valueSaved = entity.getDynamicProperty(key) as (typeof PersistentProperties)[Type];
            if (valueSaved === undefined) {
                const defaultValue = PersistentProperties[key];
                entityMap.set(key, defaultValue);

                const valueToSet = Array.isArray(defaultValue) ? JSON.stringify(defaultValue) : (defaultValue as unknown as string);
                entity.setDynamicProperty(key, valueToSet);

                DebugTimer.countEnd();
                return defaultValue;
            } else {
                const defaultValue = PersistentProperties[key];
                const value = Array.isArray(defaultValue) ? JSON.parse(defaultValue as unknown as string) : valueSaved;
                entityMap.set(key, value);

                DebugTimer.countEnd();
                return value as (typeof PersistentProperties)[Type];
            }
        };

        if (entityMap === undefined) {
            const newEntityMap = new Map<
                keyof typeof PersistentProperties,
                (typeof PersistentProperties)[keyof typeof PersistentProperties]
            >();
            this.persistentStorage.set(entity, newEntityMap);
            return onCacheMiss(newEntityMap);
        } else {
            const entityMapValue = entityMap.get(key);
            if (entityMapValue === undefined) {
                return onCacheMiss(entityMap);
            } else {
                DebugTimer.countEnd();
                return entityMapValue as (typeof PersistentProperties)[Type];
            }
        }
    }

    static set<Type extends keyof typeof PersistentProperties>(entity: Entity, key: Type, value: (typeof PersistentProperties)[Type]) {
        DebugTimer.countStart("EntityStore.set");
        const entityMap = this.persistentStorage.get(entity);
        if (entityMap === undefined) {
            const newEntityMap = new Map<
                keyof typeof PersistentProperties,
                (typeof PersistentProperties)[keyof typeof PersistentProperties]
            >();
            this.persistentStorage.set(entity, newEntityMap);
            newEntityMap.set(key, value);

            const valueToSet = Array.isArray(value) ? JSON.stringify(value) : (value as unknown as string);
            entity.setDynamicProperty(key, valueToSet);
        } else {
            entityMap.set(key, value);

            const valueToSet = Array.isArray(value) ? JSON.stringify(value) : (value as unknown as string);
            entity.setDynamicProperty(key, valueToSet);
        }

        DebugTimer.countEnd();
    }

    static setOwner(entity: Entity, owner: Entity) {
        entity.setDynamicProperty("LinkedOwnerId", owner.id);
    }

    static getOwner(entity: Entity) {
        const ownerId = this.get(entity, "LinkedOwnerId");
        if (ownerId.length === 0) return;

        return EntityUtil.getEntityById(ownerId);
    }

    static getChildren(entity: Entity, query: EntityQueryOptions) {
        return EntityUtil.getEntities(query, entity.dimension).filter((child) => {
            const childOwner = this.getOwner(child);
            return childOwner && childOwner.id === entity.id;
        });
    }

    static linkEntities(entity1: Entity, entity2: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault") {
        this.set(entity1, linkId, entity2.id);
        this.set(entity2, linkId, entity1.id);
    }

    static getLinkedEntity(entity: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault") {
        const linkedEntityId = this.get(entity, linkId);
        if (!linkedEntityId.length) return undefined;

        const linkedEntity = EntityUtil.getEntityById(linkedEntityId);
        if (!linkedEntity) return undefined;

        const linkedEntitysLinkedEntityId = this.get(linkedEntity, linkId);
        if (linkedEntitysLinkedEntityId !== entity.id) return undefined;
        return linkedEntity;
    }

    static resetLink(entity: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault") {
        this.set(entity, linkId, "");
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
            DebugTimer.countStart("EntityStore.temporary.get");
            const entityMap = _EntityStore.temporaryStorage.get(entity);
            if (entityMap === undefined) {
                const newEntityMap = new Map<
                    keyof typeof TemporaryProperties,
                    (typeof TemporaryProperties)[keyof typeof TemporaryProperties]
                >();
                _EntityStore.temporaryStorage.set(entity, newEntityMap);

                DebugTimer.countEnd();
                return TemporaryProperties[key];
            }

            if (!entityMap.has(key)) entityMap.set(key, TemporaryProperties[key]);

            const result = entityMap.get(key) as (typeof TemporaryProperties)[Type];
            DebugTimer.countEnd();
            return result;
        },

        set<Type extends keyof typeof TemporaryProperties>(entity: Entity, key: Type, value: (typeof TemporaryProperties)[Type]) {
            DebugTimer.countStart("EntityStore.temporary.set");
            const entityMap = _EntityStore.temporaryStorage.get(entity);
            if (entityMap === undefined) {
                const newEntityMap = new Map<
                    keyof typeof TemporaryProperties,
                    (typeof TemporaryProperties)[keyof typeof TemporaryProperties]
                >();
                _EntityStore.temporaryStorage.set(entity, newEntityMap);
                newEntityMap.set(key, value);
                DebugTimer.countEnd();
                return;
            }

            entityMap.set(key, value);
            DebugTimer.countEnd();
        },

        isInArray<Key extends ArrayType>(entity: Entity, key: Key, value: (typeof TemporaryProperties)[Key][0]) {
            const array = this.get(entity, key) as (typeof TemporaryProperties)[Key][0][];
            return array.includes(value);
        },

        pushToArray<Key extends ArrayType>(entity: Entity, key: Key, value: (typeof TemporaryProperties)[Key][0], unique = true) {
            const array = this.get(entity, key) as (typeof TemporaryProperties)[Key][0][];
            if (unique && array.includes(value)) return;
            array.push(value);
            this.set(entity, key, array as (typeof TemporaryProperties)[Key]);
        },

        removeFromArray<Key extends ArrayType>(entity: Entity, key: Key, value: (typeof TemporaryProperties)[Key][0]) {
            const array = this.get(entity, key) as (typeof TemporaryProperties)[Key][0][];
            const index = array.indexOf(value);
            if (index === -1) return;
            array.splice(index, 1);
            this.set(entity, key, array as (typeof TemporaryProperties)[Key]);
        },
    };

    private static temporaryStorageGC() {
        DebugTimer.countStart("EntityStore.temporaryStorageGC");
        for (const [entity] of this.temporaryStorage) {
            if (!EntityUtil.isValid(entity)) this.temporaryStorage.delete(entity);
        }
        for (const [entity] of this.persistentStorage) {
            if (!EntityUtil.isValid(entity)) this.persistentStorage.delete(entity);
        }
        DebugTimer.countEnd();
    }
}

declare global {
    // eslint-disable-next-line no-var
    var EntityStore: Omit<typeof _EntityStore, "prototype">;
}
globalThis.EntityStore = _EntityStore;
