import "GlobalVars";

import "Components/CustomComponents";
import "Prototype/Entity";
import "Prototype/system";

import { system, world } from "@minecraft/server";
import MobComponentManager from "MobComponents/MobComponentManager";

// Main is private with a _ prefix as we omit this class as a global variable
export default class _Main {
    static currentTick = 0;

    static init() {
        system.runInterval(() => this.onTick());
        EventSubscriber.subscribe("WorldAfterEvents", "worldLoad", () => this.onWorldLoad());
    }

    private static initPreliminarySystems() {
        PlayersCache.init();
        EntityStore.init();
    }

    private static initFinalSystems() {
        MobComponentManager.init();
    }

    private static onWorldLoad() {
        globalThis.overworld = world.getDimension("overworld");
        this.initPreliminarySystems();
        this.initFinalSystems();
    }

    private static onTick() {
        this.currentTick = system.currentTick;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var Main: Omit<typeof _Main, "prototype">;
}
globalThis.Main = _Main;
Main.init();
