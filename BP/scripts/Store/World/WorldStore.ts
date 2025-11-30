import { world } from "@minecraft/server";
import Properties from "./Properties";

type ArrayType<Key extends keyof typeof Properties = keyof typeof Properties> = Key extends keyof typeof Properties
    ? (typeof Properties)[Key] extends Array<unknown>
        ? Key
        : never
    : never;

class _WorldStore {
    static cache: { [key in keyof typeof Properties]?: (typeof Properties)[key] } = {};

    static get<Type extends keyof typeof Properties>(key: Type): (typeof Properties)[Type] {
        DebugTimer.countStart("WorldStore.get");
        const cachedValue = this.cache[key] as (typeof Properties)[Type];
        if (cachedValue !== undefined) {
            DebugTimer.countEnd();
            return cachedValue;
        } else {
            const valueSaved = world.getDynamicProperty(key) as (typeof Properties)[Type];
            if (valueSaved === undefined) {
                const defaultValue = Properties[key] as (typeof Properties)[Type];
                const valueToSet = Array.isArray(defaultValue) ? JSON.stringify(defaultValue) : (defaultValue as unknown as string);
                world.setDynamicProperty(key, valueToSet);
                this.cache[key] = defaultValue;
                DebugTimer.countEnd();
                return defaultValue;
            } else {
                const defaultValue = Properties[key] as (typeof Properties)[Type];
                const value = Array.isArray(defaultValue) ? JSON.parse(valueSaved as unknown as string) : valueSaved;
                this.cache[key] = value;
                DebugTimer.countEnd();
                return value;
            }
        }
    }

    static set<Type extends keyof typeof Properties>(key: Type, value: (typeof Properties)[Type]) {
        DebugTimer.countStart("WorldStore.set");
        const valueToSet = Array.isArray(value) ? JSON.stringify(value) : (value as unknown as string);
        world.setDynamicProperty(key, valueToSet);
        this.cache[key] = value;
        DebugTimer.countEnd();
    }

    static force = {
        get<T extends string | number | boolean | undefined>(key: string, defaultValue?: T): T {
            DebugTimer.countStart("WorldStore.force.get");
            const cachedValue = this.cache[key];
            if (cachedValue !== undefined) {
                DebugTimer.countEnd();
                return cachedValue;
            } else {
                const valueSaved = world.getDynamicProperty(key) as T;
                if (valueSaved === undefined) {
                    world.setDynamicProperty(key, defaultValue);
                    this.cache[key] = defaultValue;
                    DebugTimer.countEnd();
                    return defaultValue as T;
                } else {
                    this.cache[key] = valueSaved;
                    DebugTimer.countEnd();
                    return valueSaved;
                }
            }
        },

        set(key: string, value: string | number | boolean) {
            DebugTimer.countStart("WorldStore.force.set");
            world.setDynamicProperty(key, value);
            DebugTimer.countEnd();
        },
    };

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

declare global {
    // eslint-disable-next-line no-var
    var WorldStore: Omit<typeof _WorldStore, "prototype">;
}
globalThis.WorldStore = _WorldStore;
