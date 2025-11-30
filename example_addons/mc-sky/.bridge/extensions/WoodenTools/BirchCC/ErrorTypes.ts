import { ConsoleError, ExtConsoleError } from "../Mangrove/Errors/ErrorTypes";

export class ValidationError extends ConsoleError {}

export class ComponentProcessingError extends ExtConsoleError {
    constructor(identifier: string, error: Error) {
        super(`Cannot process component '${identifier}': ${error.message}`);
    }
}
