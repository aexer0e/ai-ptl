import { ItemStack, ItemUseAfterEvent, Player, ScriptEventSource } from "@minecraft/server";
import { ActionFormData, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { ScriptEventData } from "Game/ScriptEventData";
import ConfigData, { ConfigDataTypeMap } from "../Game/ConfigData";
import { ConfigEntry } from "./ConfigFactory";

const ConfigDataGeneric = ConfigData as ConfigEntry[];

/**
 * Configuration utility for managing in-game settings and script events.
 * Provides methods for initializing, retrieving, and updating configuration values via UI forms.
 */
class _Config {
    /**
     * The modal form used for configuration UI.
     */
    private static form: ModalFormData;
    /**
     * The ItemStack representing the configurables item.
     */
    private static readonly configItem = new ItemStack("gm1_common:configurables");

    /**
     * Initializes the configuration system and subscribes to item use events.
     */
    static init() {
        EventSubscriber.subscribe("WorldAfterEvents", "itemUse", (e) => this.onItemUse(e));
    }

    /**
     * Gets a configuration value by key.
     * @param key The configuration key.
     */
    static get(key: keyof ConfigDataTypeMap) {
        return ConfigFactory.getConfigValue(key);
    }

    /**
     * Initializes the configuration form for the given player.
     * @param player The player to show the form to.
     */
    private static initForm(player: Player) {
        this.form = new ModalFormData().title("Configurables");
        for (const entry of ConfigDataGeneric) {
            switch (entry.type) {
                case "dropdown":
                    this.form.dropdown(entry.label, entry.options, entry.getDefaultValue(player));
                    break;
                case "slider":
                    this.form.slider(entry.label, entry.minimumValue, entry.maximumValue, entry.valueStep, entry.getDefaultValue(player));
                    break;
                case "textField":
                    this.form.textField(entry.label, entry.placeholderText, entry.getDefaultValue(player));
                    break;
                case "toggle":
                    this.form.toggle(entry.label, entry.getDefaultValue(player));
                    break;
            }
        }
    }

    /**
     * Handles the item use event for the configurables item.
     * @param eventData The item use event data.
     */
    private static onItemUse(eventData: ItemUseAfterEvent) {
        if (eventData.itemStack.typeId !== this.configItem.typeId) return;

        if (eventData.source.isSneaking) {
            const form = new ActionFormData().title("Script Events");
            for (const scriptEventKey in ScriptEventData) {
                form.button(scriptEventKey);
            }
            form.show(eventData.source as Player).then((data) => {
                if (typeof data.selection !== "number") return;
                const [key, handler] = Object.entries(ScriptEventData)[data.selection];
                handler({ id: key, sourceEntity: eventData.source, sourceType: ScriptEventSource.Entity, message: "" });
            });
            return;
        }

        const initialValues = this.getConfigurablesList(eventData.source as Player);
        this.initForm(eventData.source as Player);
        this.form.show(eventData.source as Player).then((data) => {
            this.onFormSubmit(data, eventData.source as Player);

            // compare new values with old values and output the difference
            const newValues = this.getConfigurablesList(eventData.source as Player);
            let output = "";
            for (let i = 0; i < initialValues.length; i++) {
                if (initialValues[i][1] !== newValues[i][1]) {
                    output += `\n§b${initialValues[i][0]}§r: §c${initialValues[i][1]}§r -> §a${newValues[i][1]}§r`;
                }
            }
            if (output.length > 0) {
                BroadcastUtil.debug(`§lConfigurables changed:§r${output}`);
            }
        });
    }

    /**
     * Gets a list of current configuration values for display.
     * @param player The player to get values for.
     */
    private static getConfigurablesList(player: Player) {
        const list: [string, string | number | boolean][] = [];
        for (const entry of ConfigDataGeneric) {
            let value = entry.getDefaultValue(player);
            if (entry.type === "dropdown") {
                value = entry.options[value as number];
            } else if (entry.type === "toggle") {
                value = value ? "ON" : "OFF";
            }
            list.push([entry.label, value]);
        }
        return list;
    }

    /**
     * Handles form submission and updates configuration values.
     * @param data The form response data.
     * @param player The player who submitted the form.
     */
    private static onFormSubmit(data: ModalFormResponse, player: Player) {
        if (!data.formValues) return;

        for (let i = 0; i < data.formValues.length; i++) {
            ConfigDataGeneric[i].handler(data.formValues[i] as never, player);
        }
    }
}

declare global {
    // eslint-disable-next-line no-var
    var Config: Omit<typeof _Config, "prototype">;
}
globalThis.Config = _Config;
