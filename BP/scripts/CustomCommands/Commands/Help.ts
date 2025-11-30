import CustomCommands, { Command } from "../CustomCommands";
import CommandList from "./index";

class Help implements Command {
    getDescription = (): string => "Shows a list of available commands.";
    getPrefix = (): string => "ns_tpl:debug";
    getNames = (): string[] => ["help", "h"];
    getUsage = (): string[] => ["!help", "!help <command>"];

    run(args: string[]) {
        if (args.length === 0) {
            // No arguments
            BroadcastUtil.debug("§2Available scriptevent commands:");

            for (const command of CommandList) {
                const commandUsages: string[] = command.getUsage();
                for (const commandUsage of commandUsages) BroadcastUtil.debug(`- ${commandUsage}`);
            }
        } else {
            const command = CustomCommands.getCommand(args[0]);
            if (!command) {
                BroadcastUtil.debug(`§cUnknown custom command: ${args[0]}`);
                return;
            }

            const commandNames: string[] = command.getNames();

            if (commandNames.length === 1) BroadcastUtil.debug(`§e${commandNames[0]}:`);
            else BroadcastUtil.debug(`§e${commandNames[0]} (also ${commandNames.slice(1).join(", ")}):`);

            BroadcastUtil.debug(`§e${command.getDescription()}`);
            BroadcastUtil.debug("Usage:");

            for (const usage of command.getUsage()) BroadcastUtil.debug(`- ${usage}`);
        }
    }
}

export default Help;
