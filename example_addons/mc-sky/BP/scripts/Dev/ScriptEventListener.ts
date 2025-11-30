import { Player, ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server";
import ServerMenuManager from "Game/ServerMenu/ServerMenuManager";
import Main from "Main";
import WorldStore from "Store/World/WorldStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import DebugTimer from "Utilities/DebugTimer";
import EntityUtil from "Utilities/EntityUtil";

export default class ScriptEventListener {
    static init() {
        system.afterEvents.scriptEventReceive.subscribe(this.onScriptEventReceive.bind(this));
    }

    static onScriptEventReceive(eventData: ScriptEventCommandMessageAfterEvent) {
        const message = eventData.message;
        const player = (eventData.sourceEntity || eventData.initiator) as Player;

        switch (eventData.id) {
            case "gm1_sky:ping":
                BroadcastUtil.say(`pong ${message}`, [player]);
                break;
            case "gm1_sky:clear_ai_players":
                EntityUtil.getEntities({ type: "gm1_sky:ai_player" }, player.dimension).forEach((entity) => entity.remove());
                WorldStore.set("SerializedAiPlayers", []);
                break;
            case "gm1_sky:open_server_form":
                ServerMenuManager.delayServerMenu(player, 10);
                break;
            case "gm1_sky:debug_report":
                DebugTimer.report();
                break;
            case "gm1_sky:debug_profiler": {
                Main.overworld.runCommand("script profiler stop");
                const ticks = message.length ? parseInt(message) : 10 * 20;
                Main.overworld.runCommand("script profiler start");
                BroadcastUtil.say(`Profiler started for ${ticks / 20} seconds`, [player]);
                system.runTimeout(() => {
                    Main.overworld.runCommand("script profiler stop");
                    BroadcastUtil.say("Profiler stopped", [player]);
                }, ticks);
                break;
            }
        }
    }
}
