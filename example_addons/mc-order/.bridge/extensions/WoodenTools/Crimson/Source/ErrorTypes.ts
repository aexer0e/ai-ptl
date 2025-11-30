import { ConsoleError, ExtConsoleError } from "../../Mangrove/Errors/ErrorTypes";

/* Missing Errors */
export class MissingInputError extends ConsoleError {
    constructor(arg: string) {
        super(`Missing input '${arg}'`);
    }
}

export class MissingKeyError extends ConsoleError {
    constructor(key: string, location: string) {
        super(`Missing key '${key}' from '${location}' `);
    }
}

/* Unknown Errors */
export class UnknownCallTypeError extends ConsoleError {
    constructor(type: string) {
        super(`Unknown call type '${type}'`);
    }
}

export class UnknownMethodError extends ConsoleError {
    constructor(method: string) {
        super(`Unknown method '${method}'`);
    }
}

export class UnknownTemplateError extends ConsoleError {
    constructor(template: string) {
        super(`Unknown template '${template}'`);
    }
}

/* Misc Errors */
export class CircularReferenceError extends ExtConsoleError {
    constructor(chain: string) {
        super(`Circular reference detected in chain '${chain}'`);
    }
}

export class ExpressionEvaluationError extends ExtConsoleError {
    constructor(expression: string) {
        super(`Cannot evaluate expression '${expression}'`);
    }
}

export class GarbledJSONError extends ExtConsoleError {
    constructor(data: string) {
        super(`JSON became garbled during processing: ${data}`);
    }
}

export class LabelReferenceInObjectError extends ExtConsoleError {
    constructor(obj: string) {
        super(`Cannot reference labels within object '${obj}'`);
    }
}

export class SaplangRegisterError extends ExtConsoleError {
    constructor() {
        super(`Saplang must be registered after Crimson in the 'config.json/compiler/plugins' list`);
    }
}

/* Process Errors */
export class ObjectProcessError extends ExtConsoleError {
    constructor(identifier: string, error: Error) {
        super(`Cannot process object '${identifier}': ${error.message}`);
    }
}

export class MethodProcessError extends ExtConsoleError {
    constructor(identifier: string, error: Error) {
        super(`Cannot process method '${identifier}': ${error.message}`);
    }
}

export class TemplateProcessError extends ExtConsoleError {
    constructor(identifier: string, error: Error) {
        super(`Cannot process template '${identifier}': ${error.message}`);
    }
}

export class VanillaProcessError extends ExtConsoleError {
    constructor(identifier: string, error: Error) {
        super(`Cannot process vanilla '${identifier}': ${error.message}`);
    }
}

/* Importing Errors */
export class ImportFileError extends ExtConsoleError {
    constructor(path: string, error: Error) {
        super(`Cannot import file '${path}': ${error.message}`);
    }
}
