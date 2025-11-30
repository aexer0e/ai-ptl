import "GlobalVars";

import "Prototype/Entity";
import "Prototype/system";

import { system, world } from "@minecraft/server";
import CustomCommands from "CustomCommands/CustomCommands";
import DragonPersistence from "Dragon/DragonPersistentData";
import MobComponentManager from "MobComponents/MobComponentManager";
import TriggerManager from "Triggers/TriggerManager";
import Clipboard from "Utilities/Clipboard";
import ScriptEventListener from "Utilities/ScriptEventListener";

// Main is private with a _ prefix as we omit this class as a global variable
export default class _Main {
    static currentTick = 0;

    private static isWorldInit = false;

    static init() {
        this.initPreliminarySystems();
        system.runInterval(() => this.onTick());
    }

    private static initPreliminarySystems() {
        Clipboard.init();
        Config.init();
        PlayersCache.init();
        EntityStore.init();
        ScriptEventListener.init();
        CustomCommands.init();
        DragonPersistence.init();
    }

    private static initFinalSystems() {
        MobComponentManager.init();
        TriggerManager.init();
    }

    private static onWorldReady() {
        this.initFinalSystems();
    }

    private static onTick() {
        this.currentTick = system.currentTick;
        if (!this.isWorldInit && this.isWorldReady()) {
            this.onWorldReady();
            this.isWorldInit = true;
        }
    }

    private static isWorldReady() {
        return world.getPlayers().length;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var Main: Omit<typeof _Main, "prototype">;
}
globalThis.Main = _Main;
Main.init();
