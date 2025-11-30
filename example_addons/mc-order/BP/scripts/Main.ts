import { system, world, WorldInitializeBeforeEvent } from "@minecraft/server";
import ChaosEmeraldBlockEntity from "BlockComponents/LevelFeatures/ChaosEmeraldBlockEntity";
import ChaosMachineBlockEntity from "BlockComponents/LevelFeatures/ChaosMachineBlockEntity";
import MegaRingPlatform from "BlockComponents/LevelFeatures/MegaRingPlatform";
import ShrineMarkerBlockEntity from "BlockComponents/LevelFeatures/ShrineMarkerBlockEntity";
import Spikes from "BlockComponents/LevelFeatures/Spikes";
import SpringableBlockEntity from "BlockComponents/LevelFeatures/SpringableBlockEntity";
import DevScriptEventListener from "Dev/ScriptEventListener";
import ScriptEventListener from "Game/ScriptEventListener";
import MobComponentManager from "MobComponents/MobComponentManager";
import BadnikBounce from "Order/BadnikBounce";
import CharHealth from "Order/CharHealth";
import CharSelectTV from "Order/CharSelectTV";
import EntityEventListener from "Order/EntityEventListener";
import GameRules from "Order/GameRules";
import RingPlacerBlock from "Order/RingPlacerBlock";
import SlabCleaner from "Order/SlabCleaner";
import EntityStore from "Store/Entity/EntityStore";
import BlockUtil from "Utilities/BlockUtil";
import GameRulesUtil from "Utilities/GameRulesUtil";
import Runner from "Utilities/Runner";

export default class Main {
    static overworld = world.getDimension("overworld");
    static nether = world.getDimension("nether");
    static theEnd = world.getDimension("the end");
    private static isWorldInit = false;

    static init(shouldTrackEvents = false) {
        if (shouldTrackEvents) trackEvents();
        world.beforeEvents.worldInitialize.subscribe(this.onWorldInitialize.bind(this));
        world.afterEvents.worldInitialize.subscribe(this.afterWorldInitialize.bind(this));
        Runner.nextTick(this.onTick.bind(this));

        // CharSelectTV must be initialized here because it subscribes to world.beforeEvents.worldInitialize.
        // If you call CharSelectTV.init() after world initialization, the custom block component is not registered.
        CharSelectTV.init();
        RingPlacerBlock.init();
    }

    private static onWorldReady() {
        if (!world.scoreboard.getObjective("gm1_ord:collected_emeralds")) world.scoreboard.addObjective("gm1_ord:collected_emeralds");
        BlockUtil.init(); // Other systems use the cached dimension height values in BlockUtil so keep it high in the initialization order
        GameRulesUtil.init();
        EntityStore.init();
        MobComponentManager.init();
        DevScriptEventListener.init();
        ScriptEventListener.init();
        EntityEventListener.init();
        CharHealth.init();
        SlabCleaner.init();
        GameRules.init();
        BadnikBounce.init();
    }

    private static onWorldInitialize(event: WorldInitializeBeforeEvent) {
        // Register block component events
        const blockRegistry = event.blockComponentRegistry;
        MegaRingPlatform.register(blockRegistry);
        Spikes.register(blockRegistry);
        SpringableBlockEntity.register(blockRegistry);
        ChaosEmeraldBlockEntity.register(blockRegistry);
        ChaosMachineBlockEntity.register(blockRegistry);
        ShrineMarkerBlockEntity.register(blockRegistry);
    }

    private static afterWorldInitialize() {
        this.isWorldInit = true;
    }

    private static onTick() {
        if (!this.isWorldReady()) Runner.nextTick(this.onTick.bind(this));
        else this.onWorldReady();
    }

    private static isWorldReady() {
        return (
            (this.isWorldInit && this.overworld.getPlayers().length > 0) ||
            this.nether.getPlayers().length > 0 ||
            this.theEnd.getPlayers().length > 0
        );
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
        console.warn(string);
    }, 20);
}
