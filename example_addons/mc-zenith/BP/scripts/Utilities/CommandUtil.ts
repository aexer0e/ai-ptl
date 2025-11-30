import { system } from "@minecraft/server";

class _CommandUtil {
    private static commandQueue: string[] = [];
    private static processNextTick = false;

    private static processCommandQueue() {
        const commandsToProcess = Math.min(this.commandQueue.length, 128);
        for (let i = 0; i < commandsToProcess; i++) {
            this.processCommand(this.commandQueue.shift() as string);
        }

        if (this.commandQueue.length > 0) system.run(() => this.processCommandQueue());
        else this.processNextTick = false;
    }

    private static processCommand(command: string) {
        overworld.runCommandAsync(command);
    }

    static runCommand(command: string) {
        this.commandQueue.push(command);

        if (!this.processNextTick) {
            this.processNextTick = true;
            system.run(() => this.processCommandQueue());
        }
    }
}

declare global {
    // eslint-disable-next-line no-var
    var CommandUtil: Omit<typeof _CommandUtil, "prototype">;
}
globalThis.CommandUtil = _CommandUtil;
