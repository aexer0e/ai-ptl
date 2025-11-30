import { Player, ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import DebugTimer from "Utilities/DebugTimer";
import EventUtil from "Utilities/EventUtil";

/**
 * ScriptEventListener class to handle script events for dev testing purposes.
 * Use Game/ScriptEventlistener.ts for game logic script events.
 */
export default class DevScriptEventListener {
    /**
     * Initializes the event listener by subscribing to the script event receive.
     */
    static init() {
        EventUtil.subscribe("SystemAfterEvents", "scriptEventReceive", this.onScriptEventReceive.bind(this));
    }

    /**
     * Handles the script event receive.
     * @param event The event data received.
     */
    static onScriptEventReceive(eventData: ScriptEventCommandMessageAfterEvent) {
        const message = eventData.message;
        const player = (eventData.sourceEntity || eventData.initiator) as Player;
        switch (eventData.id) {
            case "gm1_ord:ping":
                {
                    BroadcastUtil.say(`pong ${message}`, [player]);
                    const platformType = system.serverSystemInfo;
                    const clientInfo = player.clientSystemInfo;
                    console.warn(platformType);
                    console.warn(clientInfo);
                    BroadcastUtil.say(`Platform: ${JSON.stringify(platformType)}`);
                    BroadcastUtil.say(`Client: ${JSON.stringify(clientInfo)}`);
                }
                break;
            case "gm1_ord:debug_report":
                DebugTimer.report();
                break;
            case "gm1_ord:clear_completed_shrines":
                console.warn(`Clearing ${EntityStore.get(player, "completedShrineIds").length} completed shrines`);
                EntityStore.set(player, "completedShrineIds", []);
                break;
            case "gm1_ord:debug_report_5s":
                console.warn("(DebugTimer) Clearing current counters and starting a 5s report");
                console.warn(`(DebugTimer) Report context ${message}`);
                DebugTimer.clear();
                system.runTimeout(() => {
                    console.warn("(DebugTimer) End");
                    DebugTimer.report();
                }, 5 * 20);
                break;
        }
    }
}
