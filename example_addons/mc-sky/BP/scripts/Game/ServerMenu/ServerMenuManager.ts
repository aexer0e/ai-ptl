import { ItemStack, ItemUseAfterEvent, Player, system, world } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import AiPlayers from "AiPlayers/AiPlayers";
import ServerMenuData from "Game/ServerMenu/ServerMenuData";
import BroadcastUtil from "Utilities/BroadcastUtil";
import CommandUtil from "Utilities/CommandUtil";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";

export default class ServerMenuManager {
    static form: ModalFormData;
    static readonly menuItem = new ItemStack("gm1_sky:server_menu");

    static init() {
        world.afterEvents.itemUse.subscribe((e) => this.onUse(e));
    }

    static initForm(player: Player) {
        this.form = new ModalFormData().title("AI Players - Server Menu");
        for (const entry of ServerMenuData) {
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

    static onUse(eventData: ItemUseAfterEvent) {
        const player = eventData.source as Player;

        // TODO - Remove this eslint-disable
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const isInActiveSession = AiPlayers.isSessionActive();

        if (eventData.itemStack.typeId !== this.menuItem.typeId) return;

        EntityUtil.removeEntities({ type: "gm1_sky:static_player", tags: [player.name] }, player.dimension);
        const spawnLocation = new V3(player.location.x + 1, -64, player.location.z);
        const newEntity = EntityUtil.spawnEntity("gm1_sky:static_player", spawnLocation, player.dimension);
        newEntity.addTag(player.name);

        const command = `/dialogue open @e[type=gm1_sky:static_player,x=${spawnLocation.x},y=${spawnLocation.y},z=${spawnLocation.z},c=1] @p gm1_sky:intro`;
        CommandUtil.runCommand(command);
    }

    static openServerMenu(player: Player) {
        const initialValues = this.getServerMenuList(player);
        this.initForm(player);
        this.form.show(player).then((data) => {
            this.onFormSubmit(data, player);

            // compare new values with old values and output the difference
            const newValues = this.getServerMenuList(player);
            let output = "";
            for (let i = 0; i < initialValues.length; i++) {
                if (initialValues[i][1] !== newValues[i][1]) {
                    output += `\n§b${initialValues[i][0]}§r: §c${initialValues[i][1]}§r -> §a${newValues[i][1]}§r`;
                }
            }
            if (output.length > 0) {
                BroadcastUtil.debug(`§lServer Settings changed:§r${output}`);
            }
        });
    }

    static delayServerMenu(player: Player, delay: number) {
        system.runTimeout(() => {
            EntityUtil.removeEntities({ type: "gm1_sky:static_player", tags: [player.name] }, player.dimension);
            this.openServerMenu(player);
        }, delay);
    }

    static getServerMenuList(player: Player) {
        const list: [string, string | number | boolean][] = [];
        for (const entry of ServerMenuData) {
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
            ServerMenuData[i].handler(data.formValues[i] as never, player);
        }
    }
}
