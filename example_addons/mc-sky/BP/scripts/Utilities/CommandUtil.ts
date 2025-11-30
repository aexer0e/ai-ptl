import { world } from "@minecraft/server";
import Runner from "./Runner";

export default class CommandUtil {
    private static commandQueue: string[] = [];
    private static processNextTick = false;

    private static processCommandQueue() {
        const commandsToProcess = Math.min(this.commandQueue.length, 128);
        for (let i = 0; i < commandsToProcess; i++) {
            this.processCommand(this.commandQueue.shift() as string);
        }

        if (this.commandQueue.length > 0) Runner.nextTick(this.processCommandQueue.bind(this));
        else this.processNextTick = false;
    }

    private static processCommand(command: string) {
        world.getDimension("overworld").runCommandAsync(command);
    }

    static runCommand(command: string) {
        this.commandQueue.push(command);

        if (!this.processNextTick) {
            this.processNextTick = true;
            Runner.nextTick(this.processCommandQueue.bind(this));
        }
    }
}
