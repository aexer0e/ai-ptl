import { Player, world } from "@minecraft/server";
import { Command } from "../CustomCommands";

export default class Reset implements Command {
    getDescription = (): string => "Reset game states";
    getPrefix = (): string => "ns_tpl:debug";
    getNames = (): string[] => ["reset"];
    getUsage() {
        const resetData = Object.keys(this.resetData).map((reset) => `reset ${reset}`);
        return resetData;
    }

    resetData = {
        gamerules: (sender: Player) => this.resetGameRules(sender),
        time: () => this.resetTimeOfDay(),
    };

    run(args: string[], sender: Player) {
        if (!args.length) return "Missing reset function";
        if (args[0].toLowerCase() === "all") {
            const resetData = Object.keys(this.resetData);
            resetData.forEach((reset) => this.resetData[reset](sender));
        }
        const resetFunctionKey = args[0].toLowerCase() as keyof typeof this.resetData;
        if (!this.resetData[resetFunctionKey]) {
            return `Reset function not found: ${args[0]}`;
        }

        this.performReset(args[0].toLowerCase() as keyof typeof this.resetData, sender);
    }

    performReset(resetFunction: keyof typeof this.resetData, sender: Player) {
        this.resetData[resetFunction](sender);
        sender.sendMessage(`§a${resetFunction} has been reset`);
    }

    resetGameRules(sender: Player) {
        world.gameRules.sendCommandFeedback = false;
        sender.sendMessage("§aResetting Game rules");
        world.gameRules.commandBlockOutput = false;
        /*world.gameRules.doDayLightCycle = false;
        world.gameRules.doEntityDrops = true;
        world.gameRules.doFireTick = false;
        world.gameRules.doImmediateRespawn = false;
        world.gameRules.doInsomnia = false;
        world.gameRules.doLimitedCrafting = false;
        world.gameRules.doMobLoot = true;
        world.gameRules.doMobSpawning = false;
        world.gameRules.doTileDrops = true;
        world.gameRules.doWeatherCycle = false;
        world.gameRules.fallDamage = true;
        world.gameRules.fireDamage = true;
        world.gameRules.freezeDamage = true;
        world.gameRules.keepInventory = true;
        world.gameRules.mobGriefing = true;
        world.gameRules.naturalRegeneration = false;
        world.gameRules.pvp = false;
        world.gameRules.randomTickSpeed = 0;
        world.gameRules.recipesUnlock = false;
        world.gameRules.showCoordinates = false;
        world.gameRules.showDeathMessages = true;
        world.gameRules.showDaysPlayed = false;
        world.gameRules.showRecipeMessages = false;
        world.gameRules.showTags = false;
        world.gameRules.projectilesCanBreakBlocks = false;
        world.gameRules.spawnRadius = 1;*/
    }

    resetTimeOfDay() {
        world.setTimeOfDay(3200);
    }
}
