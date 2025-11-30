export class ConsoleError extends Error {}

type ExtConsoleErrorConstructor = new (identifier: string, e: Error) => ExtConsoleError;
export class ExtConsoleError extends ConsoleError {
    static with(identifier: string) {
        const t = this as ExtConsoleErrorConstructor;
        return (e: Error) => new t(identifier, e);
    }
}
