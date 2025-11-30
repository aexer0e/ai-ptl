import { system } from "@minecraft/server";

/**
 * A utility class for scheduling and managing timed callbacks.
 *
 * @remarks
 * This class provides static methods to run callbacks at specified intervals,
 * after a timeout, or on the next tick. It also provides a method to clear
 * scheduled intervals.
 */
export default class Runner {
    /**
     * Schedules a callback to be run at specified intervals.
     *
     * @param callback - The function to be called at each interval.
     * @param interval - The time in milliseconds between each call.
     * @param beginImmediately - Whether to run the callback immediately before starting the interval.
     * @returns The interval ID which can be used to clear the interval.
     *
     * @example
     * ```typescript
     * // Run a callback every 5 seconds
     * const intervalId = Runner.interval(() => {
     *     console.log("This runs every 5 seconds");
     * }, 5000);
     * ```
     */
    static interval(callback: () => void, interval: number, beginImmediately = false): number {
        if (beginImmediately) system.run(callback);
        return system.runInterval(callback, interval);
    }

    /**
     * Schedules a callback to be run after a specified timeout.
     *
     * @param callback - The function to be called after the timeout.
     * @param timeout - The time in milliseconds to wait before calling the callback.
     * @returns The timeout ID which can be used to clear the timeout.
     *
     * @example
     * ```typescript
     * // Run a callback after 3 seconds
     * const timeoutId = Runner.timeout(() => {
     *     console.log("This runs after 3 seconds");
     * }, 3000);
     * ```
     */
    static timeout(callback: () => void, timeout: number): number {
        return system.runTimeout(callback, timeout);
    }

    /**
     * Schedules a callback to be run on the next tick.
     *
     * @param callback - The function to be called on the next tick.
     * @returns The tick ID which can be used to clear the tick.
     *
     * @example
     * ```typescript
     * // Run a callback on the next tick
     * Runner.nextTick(() => {
     *     console.log("This runs on the next tick");
     * });
     * ```
     */
    static nextTick(callback: () => void): number {
        return system.run(callback);
    }

    /**
     * Clears a scheduled interval or timeout.
     *
     * @param interval - The ID of the interval or timeout to clear.
     *
     * @example
     * ```typescript
     * // Clear the interval
     * Runner.clear(intervalId);
     * ```
     */
    static clear(interval: number): void {
        system.clearRun(interval || 0);
    }
}
