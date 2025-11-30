import { Player } from "@minecraft/server";

export interface Command {
    getNames(): string[];
    getDescription(): string;
    getUsage(): string[];
    run(args: string[], sender: Player): boolean | void;
}
