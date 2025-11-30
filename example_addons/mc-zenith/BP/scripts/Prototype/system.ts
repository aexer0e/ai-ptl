import { system } from "@minecraft/server";

/**
 * Extends the Minecraft system interface with additional utility methods.
 */
declare module "@minecraft/server" {
    interface System {
        /**
         * Runs a callback immediately, then continues to run it at the specified interval.
         * @param callback The function to run.
         * @param tickDelay The interval in ticks between subsequent runs.
         * @returns The interval ID.
         */
        runIntervalImmediate(callback: () => void, tickDelay: number): number;
    }
}

/**
 * Runs a callback immediately, then continues to run it at the specified interval.
 * @param callback The function to run.
 * @param tickDelay The interval in ticks between subsequent runs.
 * @returns The interval ID.
 */
system.runIntervalImmediate = function (callback: () => void, tickDelay: number) {
    callback();
    return system.runInterval(callback, tickDelay);
};
