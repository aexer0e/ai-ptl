import { WorldInitializeBeforeEvent, system, world } from "@minecraft/server";
import AiPlayers from "AiPlayers/AiPlayers";
import AiBedBlockEntity from "BlockComponents/AiBedBlockEntity";
import Clipboard from "Dev/Clipboard";
import ConfigurablesManager from "Dev/Configurables/ConfigurablesManager";
import ScriptEventListener from "Dev/ScriptEventListener";
import ServerMenuManager from "Game/ServerMenu/ServerMenuManager";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityStore from "Store/Entity/EntityStore";
import TriggerManager from "Triggers/TriggerManager";
import BroadcastUtil from "Utilities/BroadcastUtil";
import Runner from "Utilities/Runner";
import PlayersCache from "Wrappers/PlayersCache";

export default class Main {
    static overworld = world.getDimension("overworld");
    private static isWorldInit = false;

    static init(shouldTrackEvents = false) {
        if (shouldTrackEvents) trackEvents();
        world.beforeEvents.worldInitialize.subscribe(this.onWorldInitialize.bind(this));
        world.afterEvents.worldInitialize.subscribe(this.afterWorldInitialize.bind(this));
        Runner.nextTick(this.onTick.bind(this));
    }

    private static onWorldReady() {
        PlayersCache.init();
        EntityStore.init();
        MobComponentManager.init();
        ConfigurablesManager.init();
        ServerMenuManager.init();
        ScriptEventListener.init();
        Clipboard.init();
        TriggerManager.init();
        AiPlayers.init();
    }

    private static onWorldInitialize(event: WorldInitializeBeforeEvent) {
        const blockRegistry = event.blockComponentRegistry;
        AiBedBlockEntity.register(blockRegistry);
    }

    private static afterWorldInitialize() {
        this.isWorldInit = true;
    }

    private static onTick() {
        if (!this.isWorldReady()) Runner.nextTick(this.onTick.bind(this));
        else this.onWorldReady();
    }

    private static isWorldReady() {
        return this.isWorldInit && world.getPlayers().length;
    }
}

Main.init();

// refactor this into a utility
function trackEvents() {
    const subbedCallbacks: { [eventName: string]: (() => void)[] } = {};

    for (const eventName in world.afterEvents) {
        world.afterEvents[eventName]._subscribe = world.afterEvents[eventName].subscribe;
        world.afterEvents[eventName]._unsubscribe = world.afterEvents[eventName].unsubscribe;
        world.afterEvents[eventName].subscribe = function (handler) {
            world.afterEvents[eventName]._subscribe(handler);
            subbedCallbacks[eventName] = subbedCallbacks[eventName] || [];
            subbedCallbacks[eventName].push(handler);
        };
        world.afterEvents[eventName].unsubscribe = function (handler) {
            world.afterEvents[eventName]._unsubscribe(handler);
            subbedCallbacks[eventName] = subbedCallbacks[eventName] || [];
            const index = subbedCallbacks[eventName].findIndex((callback) => callback == handler);
            if (index != -1) subbedCallbacks[eventName].splice(index, 1);
        };
    }

    system.runInterval(() => {
        let string = "\n";
        for (const event in subbedCallbacks) {
            string += `${event}: ${subbedCallbacks[event].length}\n`;
        }
        BroadcastUtil.debug(string);
    }, 20);
}
