import { system } from "@minecraft/server";

declare module "@minecraft/server" {
    interface System {
        runIntervalImmediate(callback: () => void, tickDelay: number): number;
    }
}

system.runIntervalImmediate = function (callback: () => void, tickDelay: number) {
    callback();
    return system.runInterval(callback, tickDelay);
};
