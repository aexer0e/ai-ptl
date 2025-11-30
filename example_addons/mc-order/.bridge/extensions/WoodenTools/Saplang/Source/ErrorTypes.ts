import { ConsoleError, ExtConsoleError } from "../../Mangrove/Errors/ErrorTypes";

export class InvalidLineError extends ConsoleError {
    constructor(line: string) {
        super(`Invalid line '${JSON.stringify(line).slice(1, -1)}'`);
    }
}

export class LangProcessingError extends ExtConsoleError {
    constructor(identifier: string, error: Error) {
        super(`Cannot process file '${identifier}': ${error.message}`);
    }
}
