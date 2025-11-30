import { system } from "@minecraft/server";

export default class Runner {
    static interval(callback: () => void, interval: number, beginImmediately = false): number {
        if (beginImmediately) system.run(callback);
        return system.runInterval(callback, interval);
    }

    static timeout(callback: () => void, timeout: number): number {
        return system.runTimeout(callback, timeout);
    }

    static nextTick(callback: () => void): number {
        return system.run(callback);
    }

    static clear(interval: number): void {
        system.clearRun(interval || 0);
    }
}
