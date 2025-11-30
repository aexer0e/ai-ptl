import { ConsoleError } from "./ErrorTypes";

declare type Function<T> = (...args: any[]) => T;
type ExtErrorWithId = (e: Error) => ConsoleError;

export default class ErrorHandler {
    /** Extend any user errors into another error */
    private static extend(e: Error, extErrorWithId: ExtErrorWithId) {
        if (e instanceof ConsoleError) throw extErrorWithId(e);
        else throw e;
    }

    /** Run function and extend any user errors into another error */
    public static extendConsoleErrors<T>(run: Function<T>, extErrorWithId: ExtErrorWithId) {
        try {
            return run();
        } catch (e) {
            throw this.extend(e, extErrorWithId);
        }
    }

    /** Asynchronously run function and extend any user errors into another error  */
    public static async extendConsoleErrorsAsync<T>(run: Function<T>, extErrorWithId: ExtErrorWithId) {
        try {
            return await run();
        } catch (e) {
            throw this.extend(e, extErrorWithId);
        }
    }

    /** Log user errors */
    private static log(e: Error, plugin: string) {
        if (e instanceof ConsoleError) console.error(`(${plugin}) ${e.message}`);
        else throw e;
    }

    /** Run function and log user errors */
    public static logConsoleErrors<T>(run: Function<T>, plugin: string) {
        try {
            return run();
        } catch (e) {
            this.log(e, plugin);
        }
    }

    /** Asynchronously run function and log user errors */
    public static async logConsoleErrorsAsync<T>(run: Function<T>, plugin: string) {
        try {
            return await run();
        } catch (e) {
            this.log(e, plugin);
        }
    }

    /** Both */
    public static extendAndLogConsoleErrors<T>(run: Function<T>, extErrorWithId: ExtErrorWithId, plugin: string) {
        try {
            return this.extendConsoleErrors(run, extErrorWithId);
        } catch (e) {
            this.log(e, plugin);
        }
    }

    /** Asynchronously both */
    public static async extendAndLogConsoleErrorsAsync<T>(run: Function<T>, extErrorWithId: ExtErrorWithId, plugin: string) {
        try {
            return await this.extendConsoleErrorsAsync(run, extErrorWithId);
        } catch (e) {
            this.log(e, plugin);
        }
    }

    /** Warn */
    public static warn(message: string, plugin: string) {
        console.warn(`(${plugin}) ${message}`);
    }
}
