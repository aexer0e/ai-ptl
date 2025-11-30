import { Entity, system } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import { PersistentProperties, TemporaryProperties } from "./Properties";

type ArrayType<Key extends keyof typeof PersistentProperties = keyof typeof PersistentProperties> =
    Key extends keyof typeof PersistentProperties ? ((typeof PersistentProperties)[Key] extends Array<unknown> ? Key : never) : never;

// get the keys of a type, eg keys that are a string
type PropertKeyOfType<Type> = {
    [Key in keyof typeof PersistentProperties]: (typeof PersistentProperties)[Key] extends Type ? Key : never;
}[keyof typeof PersistentProperties];
/**
 * EntityStore class to manage the setting, caching and retrieval of dynamic properties on an entity, including temporary data
 */
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

    /**
     * Retrieves the value associated with the specified key from the persistent storage of the given entity.
     * If the value is not found in the cache, it attempts to fetch it from the entity's dynamic properties.
     * If the value is still not found, it sets and returns the default value from `PersistentProperties`.
     *
     * @template Type - The type of the key, which must be a key of `PersistentProperties`.
     * @param {Entity} entity - The entity from which to retrieve the value.
     * @param {Type} key - The key whose associated value is to be returned.
     * @returns {(typeof PersistentProperties)[Type]} - The value associated with the specified key.
     */
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

    static setOwner(entity: Entity, owner: Entity) {
        entity.setDynamicProperty("linkedOwnerId", owner.id);
        EntityStore.pushToArray(owner, "linkedChildrenIds", entity.id);
    }

    static getOwner(entity: Entity) {
        const ownerId = this.get(entity, "linkedOwnerId");
        if (ownerId === undefined) return undefined;

        return EntityUtil.getEntityById(ownerId);
    }

    static getChildren(entity: Entity) {
        const childrenIds = this.get(entity, "linkedChildrenIds");
        return childrenIds.map((id) => EntityUtil.getEntityById(id)).filter((entity) => entity !== undefined) as Entity[];
    }

    static linkEntities(entity1: Entity, entity2: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault") {
        this.set(entity1, linkId, entity2.id);
        this.set(entity2, linkId, entity1.id);
    }

    static getLinkedEntity(entity: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault", otherEntityMustBeLinked = true) {
        const linkedEntityId = this.get(entity, linkId);
        if (!linkedEntityId.length) return undefined;

        const linkedEntity = EntityUtil.getEntityById(linkedEntityId);
        if (!linkedEntity) return undefined;

        if (otherEntityMustBeLinked) {
            const linkedEntitysLinkedEntityId = this.get(linkedEntity, linkId);
            if (linkedEntitysLinkedEntityId !== entity.id) return undefined;
        }

        return linkedEntity;
    }

    static isLinkedEntitySet(entity: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault") {
        return this.get(entity, linkId).length > 0;
    }

    static resetLink(entity: Entity, linkId: PropertKeyOfType<string> = "linkIdDefault") {
        this.set(entity, linkId, "");
    }
    /**
     * Sets a persistent property for a given entity.
     *
     * @template Type - The type of the property key, which must be a key of `PersistentProperties`.
     * @param {Entity} entity - The entity for which the property is being set.
     * @param {Type} key - The key of the property to set.
     * @param {(typeof PersistentProperties)[Type]} value - The value to set for the specified property key.
     *
     * This method updates the persistent storage for the entity. If the entity does not already have
     * an entry in the persistent storage, a new map is created and the property is set. The value is
     * also set as a dynamic property on the entity. If the value is an array, it is stringified before
     * being set as a dynamic property.
     */
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

    /**
     * A static object that provides methods to get and set temporary properties for entities.
     *
     * @template Type - The type of the key in the TemporaryProperties object.
     */
    static temporary = {
        /**
         * Gets a temporary property for an entity.
         * @template Type - The type of the key in the TemporaryProperties object.
         * @param entity - The entity for which to get the temporary property.
         * @param key - The key of the temporary property to get.
         * @returns The value of the temporary property.
         */
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

        /**
         * Sets a temporary property for an entity.
         * @template Type - The type of the key in the TemporaryProperties object.
         * @param entity - The entity for which to set the temporary property.
         * @param key - The key of the temporary property to set.
         * @param value - The value of the temporary property to set.
         */
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
