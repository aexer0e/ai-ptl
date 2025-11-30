import { Player, world } from "@minecraft/server";
import { ConfigDataTypeMap } from "Game/ConfigData";

interface ConfigurableDataAbstract {
    type: "dropdown" | "slider" | "textField" | "toggle";
    label: string;
    handler: (data: number | boolean | string, player: Player) => void;
}

interface ConfigEntryDropdown extends ConfigurableDataAbstract {
    type: "dropdown";
    options: string[];
    handler: (data: number, player: Player) => void;
    getDefaultValue: (player: Player) => number;
}

interface ConfigEntrySlider extends ConfigurableDataAbstract {
    type: "slider";
    minimumValue: number;
    maximumValue: number;
    valueStep: number;
    handler: (data: number, player: Player) => void;
    getDefaultValue: (player: Player) => number;
}

interface ConfigEntryTextField extends ConfigurableDataAbstract {
    type: "textField";
    placeholderText: string;
    handler: (data: string, player: Player) => void;
    getDefaultValue: (player: Player) => string;
}

interface ConfigEntryToggle extends ConfigurableDataAbstract {
    type: "toggle";
    handler: (data: boolean, player: Player) => void;
    getDefaultValue: (player: Player) => boolean;
}

export type ConfigEntry = ConfigEntryDropdown | ConfigEntrySlider | ConfigEntryTextField | ConfigEntryToggle;

/**
 * Factory utility for creating and managing configuration entries and values.
 * Provides helpers for toggles, dropdowns, sliders, and text fields with versioning and caching.
 */
class _ConfigFactory {
    /**
     * Sanitizes a key to be alphanumeric only.
     * @param key The key to sanitize.
     */
    static safeKey(key: string) {
        return key.replace(/[^a-zA-Z0-9]/g, "");
    }

    /**
     * In-memory cache for config values.
     */
    static cache: { [key: string]: unknown } = {};

    /**
     * Gets a config value by safe key, with optional default.
     * @param key The config key.
     * @param defaultValue The default value if not set.
     */
    static get<T extends string | number | boolean | undefined>(key: string, defaultValue?: T): T {
        DebugTimer.countStart("this.get");
        const cachedValue = this.cache[key];
        if (cachedValue !== undefined) {
            DebugTimer.countEnd();
            return cachedValue as T;
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
    }

    /**
     * Sets a config value by key.
     * @param key The config key.
     * @param value The value to set.
     */
    static set(key: string, value: string | number | boolean) {
        DebugTimer.countStart("this.set");
        world.setDynamicProperty(key, value);
        this.cache[key] = value;
        DebugTimer.countEnd();
    }

    /**
     * Gets a config value from the ConfigDataTypeMap by key.
     * @param key The config data key.
     */
    static getConfigValue<K extends keyof ConfigDataTypeMap>(key: K) {
        const safeKey = this.safeKey(key);
        return this.get(safeKey) as ConfigDataTypeMap[K];
    }

    /**
     * Creates a toggle config entry with versioning.
     * @param key The config key.
     * @param defaultValue The default value.
     * @param version Optional version for migration.
     */
    static toggle<Key extends string>(key: Key, defaultValue: boolean, version = 0) {
        const safeKey = this.safeKey(key);
        const currentVersion = this.get(safeKey + "Version");
        if (currentVersion !== version) {
            this.set(safeKey, defaultValue);
            this.set(safeKey + "Version", version);
        }

        return {
            type: "toggle",
            label: key as Key,
            getDefaultValue: () => this.get(safeKey, defaultValue),
            handler: (data: boolean) => {
                this.set(safeKey, data);
            },
        } as const;
    }

    /**
     * Creates a dropdown config entry with versioning.
     * @param key The config key.
     * @param options The dropdown options.
     * @param defaultValue The default value.
     * @param version Optional version for migration.
     */
    static dropdown<Key extends string>(key: Key, options: string[], defaultValue: string, version = 0) {
        let index = options.indexOf(defaultValue);
        if (index === -1) {
            console.warn(`Default value for dropdown ${key} is not in the options list. Defaulting to the first option.`);
            index = 0;
        }

        const safeKey = this.safeKey(key);
        const currentVersion = this.get(safeKey + "Version");
        if (currentVersion !== version) {
            this.set(safeKey, defaultValue);
            this.set(safeKey + "Version", version);
        }

        return {
            type: "dropdown",
            label: key as Key,
            options,
            getDefaultValue: () => this.get(safeKey, index),
            handler: (data: number) => {
                this.set(safeKey, data);
            },
        } as const;
    }

    /**
     * Creates a slider config entry with versioning.
     * @param key The config key.
     * @param minimumValue The minimum value.
     * @param maximumValue The maximum value.
     * @param valueStep The step value.
     * @param defaultValue The default value.
     * @param version Optional version for migration.
     */
    static slider<Key extends string>(
        key: Key,
        minimumValue: number,
        maximumValue: number,
        valueStep: number,
        defaultValue: number,
        version = 0
    ) {
        const safeKey = this.safeKey(key);
        const currentVersion = this.get(safeKey + "Version");
        if (currentVersion !== version) {
            this.set(safeKey, defaultValue);
            this.set(safeKey + "Version", version);
        }

        return {
            type: "slider",
            label: key as Key,
            minimumValue,
            maximumValue,
            valueStep,
            getDefaultValue: () => this.get(safeKey, defaultValue),
            handler: (data: number) => {
                this.set(safeKey, data);
            },
        } as const;
    }

    /**
     * Creates a text field config entry with versioning.
     * @param key The config key.
     * @param placeholderText The placeholder text.
     * @param defaultValue The default value.
     * @param version Optional version for migration.
     */
    static textField<Key extends string>(key: Key, placeholderText: string, defaultValue: string, version = 0) {
        const safeKey = this.safeKey(key);
        const currentVersion = this.get(safeKey + "Version");
        if (currentVersion !== version) {
            this.set(safeKey, defaultValue);
            this.set(safeKey + "Version", version);
        }

        return {
            type: "textField",
            label: key as Key,
            placeholderText,
            getDefaultValue: () => this.get(safeKey, defaultValue),
            handler: (data: string) => {
                this.set(safeKey, data);
            },
        } as const;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var ConfigFactory: Omit<typeof _ConfigFactory, "prototype">;
}
globalThis.ConfigFactory = _ConfigFactory;
