import { world } from "@minecraft/server";
import DebugTimer from "./DebugTimer";
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
        DebugTimer.countStart("CommandUtilRunCommand");
        world.getDimension("overworld").runCommandAsync(command);
        DebugTimer.countEnd();
    }

    /**
     * Adds a command to the command queue and schedules it for execution.
     * If the command queue is not already being processed, it schedules the processing
     * of the command queue on the next tick. 128 commands can be processed per tick.
     *
     * @param command - The command to be added to the queue.
     */
    static runCommand(command: string) {
        this.commandQueue.push(command);

        if (!this.processNextTick) {
            this.processNextTick = true;
            Runner.nextTick(this.processCommandQueue.bind(this));
        }
    }
}
