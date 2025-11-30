import { ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import { ScriptEventData } from "Game/ScriptEventData";

export default class ScriptEventListener {
    static init() {
        EventSubscriber.subscribe("SystemAfterEvents", "scriptEventReceive", (eventData) => this.onScriptEventReceive(eventData));
    }

    static onScriptEventReceive(eventData: ScriptEventCommandMessageAfterEvent) {
        const id = eventData.id;
        ScriptEventData[id]?.(eventData);
    }
}
