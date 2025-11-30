import { world } from "@minecraft/server";
import DebugTimer from "Utilities/DebugTimer";
import Properties from "./Properties";

type ArrayType<Key extends keyof typeof Properties = keyof typeof Properties> = Key extends keyof typeof Properties
    ? (typeof Properties)[Key] extends Array<unknown>
        ? Key
        : never
    : never;

/**
 * WorldStore class to manage the caching and retrieval of dynamic properties in the world.
 */
export default class WorldStore {
    static cache: { [key in keyof typeof Properties]?: (typeof Properties)[key] } = {};

    static force = {
        get<T extends string | number | boolean | undefined>(key: string, defaultValue?: T): T {
            DebugTimer.countStart("WorldStore.force.get");
            const cachedValue = WorldStore.cache[key];
            if (cachedValue !== undefined) {
                DebugTimer.countEnd();
                return cachedValue;
            } else {
                const valueSaved = world.getDynamicProperty(key) as T;
                if (valueSaved === undefined) {
                    world.setDynamicProperty(key, defaultValue);
                    WorldStore.cache[key] = defaultValue;
                    DebugTimer.countEnd();
                    return defaultValue as T;
                } else {
                    WorldStore.cache[key] = valueSaved;
                    DebugTimer.countEnd();
                    return valueSaved;
                }
            }
        },

        set(key: string, value?: string | number | boolean) {
            DebugTimer.countStart("WorldStore.force.set");
            world.setDynamicProperty(key, value);
            DebugTimer.countEnd();
        },
    };

    /**
     * Retrieves a value from the cache or the dynamic properties of the world.
     * If the value is not found in the cache, it attempts to retrieve it from the world's dynamic properties.
     * If the value is still not found, it sets a default value in the world's dynamic properties and cache.
     *
     * @template Type - The type of the key to retrieve.
     * @param {Type} key - The key of the property to retrieve.
     * @returns {(typeof Properties)[Type]} - The value associated with the key.
     */
    static get<Type extends keyof typeof Properties>(key: Type): (typeof Properties)[Type] {
        if (this.cache[key] !== undefined) {
            const cachedValue = this.cache[key] as (typeof Properties)[Type];
            return cachedValue;
        } else {
            const valueSaved = world.getDynamicProperty(key) as (typeof Properties)[Type];
            if (valueSaved === undefined) {
                const defaultValue = Properties[key] as (typeof Properties)[Type];
                const valueToSet = Array.isArray(defaultValue) ? JSON.stringify(defaultValue) : (defaultValue as unknown as string);
                world.setDynamicProperty(key, valueToSet);
                this.cache[key] = defaultValue;
                return defaultValue;
            } else {
                const defaultValue = Properties[key] as (typeof Properties)[Type];
                const value = Array.isArray(defaultValue) ? JSON.parse(valueSaved as unknown as string) : valueSaved;
                this.cache[key] = value;
                return value;
            }
        }
    }

    /**
     * Sets a dynamic property in the world and updates the cache with the given key-value pair.
     *
     * @template Type - The type of the key, which must be a key of the `Properties` object.
     * @param {Type} key - The key of the property to set.
     * @param {(typeof Properties)[Type]} value - The value to set for the specified key. If the value is an array, it will be stringified.
     */
    static set<Type extends keyof typeof Properties>(key: Type, value: (typeof Properties)[Type]) {
        const valueToSet = Array.isArray(value) ? JSON.stringify(value) : (value as unknown as string);
        world.setDynamicProperty(key, valueToSet);
        this.cache[key] = value;
    }

    static isInArray<Key extends ArrayType>(key: Key, value: (typeof Properties)[Key][0]) {
        const array = this.get(key) as (typeof Properties)[Key][0][];
        return array.includes(value);
    }

    static pushToArray<Key extends ArrayType>(key: Key, value: (typeof Properties)[Key][0], unique = true) {
        const array = this.get(key) as (typeof Properties)[Key][0][];
        if (unique && array.includes(value)) return;
        array.push(value);
        this.set(key, array as (typeof Properties)[Key]);
    }

    static removeFromArray<Key extends ArrayType>(key: Key, value: (typeof Properties)[Key][0]) {
        const array = this.get(key) as (typeof Properties)[Key][0][];
        const index = array.indexOf(value);
        if (index === -1) return;
        array.splice(index, 1);
        this.set(key, array as (typeof Properties)[Key]);
    }
}
