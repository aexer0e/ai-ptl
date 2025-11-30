import { Player } from "@minecraft/server";
import { Command } from "../CustomCommands";

export default class To implements Command {
    getDescription = (): string => "TP tp an objective";
    getPrefix = (): string => "ns_tpl:debug";
    getNames = (): string[] => ["to"];
    getUsage = (): string[] => {
        return Object.entries(GameData.ToLocations).map((objective, index) => `to <${index}|${objective[0]}>`);
    };

    run(args: string[], sender: Player) {
        if (!args.length) return true;

        const isNumber = !isNaN(parseInt(args[0]));
        const objective = isNumber ? Object.keys(GameData.ToLocations)[parseInt(args[0])] : args[0];
        if (!objective) return `Objective not found: ${args[0]}`;

        const location = GameData.ToLocations[objective];
        sender.teleport(location);
    }
}
