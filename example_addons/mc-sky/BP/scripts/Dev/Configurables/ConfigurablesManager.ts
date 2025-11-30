import { ItemStack, ItemUseAfterEvent, Player, world } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import BroadcastUtil from "Utilities/BroadcastUtil";
import ConfigurablesData from "./ConfigurablesData";

export default class ConfigurablesManager {
    static form: ModalFormData;
    static readonly configItem = new ItemStack("gm1_common:configurables");

    static init() {
        world.afterEvents.itemUse.subscribe((e) => this.onItemUse(e));
    }

    static initForm(player: Player) {
        this.form = new ModalFormData().title("Configurables");
        for (const entry of ConfigurablesData) {
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

    static onItemUse(eventData: ItemUseAfterEvent) {
        if (eventData.itemStack.typeId !== this.configItem.typeId) return;

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

    static getConfigurablesList(player: Player) {
        const list: [string, string | number | boolean][] = [];
        for (const entry of ConfigurablesData) {
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

    static onFormSubmit(data: ModalFormResponse, player: Player) {
        if (!data.formValues) return;

        for (let i = 0; i < data.formValues.length; i++) {
            ConfigurablesData[i].handler(data.formValues[i] as never, player);
        }
    }
}
