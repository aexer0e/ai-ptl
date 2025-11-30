import { Player, ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server";

type IScriptEventData = Record<string, (eventData: ScriptEventCommandMessageAfterEvent) => void>;
export const ScriptEventData: IScriptEventData = {
    "ns_tpl:ping": (eventData) => {
        const player = (eventData.sourceEntity || eventData.initiator) as Player | undefined;
        BroadcastUtil.say(`pong ${eventData.message}`, player ? [player] : undefined);
    },

    "ns_tpl:debug_report": () => {
        DebugTimer.report();
    },

    "ns_tpl:debug_report_10s": (eventData) => {
        console.warn("(DebugTimer) Clearing current counters and starting a 10s report");
        if (eventData.message.length) console.warn(`(DebugTimer) Report context ${eventData.message}`);
        DebugTimer.clear();
        system.runTimeout(() => {
            console.warn("(DebugTimer) End");
            DebugTimer.report();
        }, 10 * 20);
    },

    "ns_tpl:game_event": (eventData) => {
        const message = eventData.message;
        const args = message.split(/\s+/);
        const eventType = args[0];

        switch (eventType) {
            case "example": {
                BroadcastUtil.say(`Example event received: ${message}`);
                break;
            }
        }
    },
};
