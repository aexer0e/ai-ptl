import { Player } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import EntityStore from "Store/Entity/EntityStore";
import Runner from "Utilities/Runner";

export default class ConfigurableMenu {
    static open(player: Player) {
        // This open menu operation need to wait at least 10 ticks for waiting previous menu to close
        Runner.timeout(() => {
            const canRunBreak = EntityStore.get(player, "canRunBreak");
            const canAbilityBreak = EntityStore.get(player, "canAbilityBreak");
            const canDamagePassiveMobs = EntityStore.get(player, "canDamagePassiveMobs");

            const form = new ModalFormData()
                .title("config.title")
                .toggle("config.runblockbreaking", canRunBreak)
                .toggle("config.abilityblockbreaking", canAbilityBreak)
                .toggle("config.passivemobs", canDamagePassiveMobs)
                .submitButton("config.submit");

            form.show(player).then((response) => {
                if (!response.formValues) return;
                const [runBreak, abilityBreak, damagePassiveMobs] = response.formValues as boolean[];

                EntityStore.set(player, "canRunBreak", runBreak);
                EntityStore.set(player, "canAbilityBreak", abilityBreak);
                EntityStore.set(player, "canDamagePassiveMobs", damagePassiveMobs);

                const getLangKey = (baseKey: string, value: boolean): string => `${baseKey}.${value ? "true" : "false"}`;

                player.sendMessage({ translate: "config.updated" });
                player.sendMessage({ translate: getLangKey("config.runbreak", runBreak) });
                player.sendMessage({ translate: getLangKey("config.abilitybreak", abilityBreak) });
                player.sendMessage({ translate: getLangKey("config.damagepassive", damagePassiveMobs) });
            });
        }, 10);
    }
}
