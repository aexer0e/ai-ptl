import { Player, ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server";
import { Maybe } from "Types/GenericTypes";
import CommandList from "./Commands/index";

export interface Command {
    getPrefix(): string;
    getNames(): string[];
    getDescription(): string;
    getUsage(): string[];
    run(args: string[], sender: Player): boolean | string | void;
}

export default class CustomCommands {
    static init() {
        EventSubscriber.subscribe("SystemAfterEvents", "scriptEventReceive", (eventData) => this.onScriptEventReceive(eventData));
    }

    static onScriptEventReceive(event: ScriptEventCommandMessageAfterEvent): void {
        const id = event.id;
        if (id !== "gm1:debug") return;

        const message = event.message;
        const player = (event.sourceEntity || event.initiator) as Player;
        if (!message) return BroadcastUtil.say("§cMissing command use /scriptevent gm1:debug help");
        const args = message.split(" ");

        const commandName = args[0];
        const argv = args.slice(1);

        const command = this.getCommand(commandName);
        if (command) {
            system.run(() => {
                const commandFailed = command.run(argv, player);
                if (commandFailed) {
                    let txt = `§cFailed to execute command: ${commandName}`;
                    if (typeof commandFailed === "string") txt += ` (${commandFailed})`;
                    txt += `\nUsage: ${command.getUsage().join(", ")}`;

                    BroadcastUtil.say(txt);
                }
            });
        } else BroadcastUtil.debug(`§cUnknown custom command: ${commandName}`);
    }

    static getCommand(commandName: string): Maybe<Command> {
        for (const command of CommandList) {
            if (command.getNames().indexOf(commandName) !== -1) {
                return command;
            }
        }
        return null;
    }
}
