import JsonUtils from "../../Mangrove/Utilities/JsonUtils";
import Constants from "./Constants";
import { ExpressionEvaluationError, MissingInputError } from "./ErrorTypes";
import { JSONValue, Scope, ScopeObjects, VarDefinition } from "./Types";

export default class Utils {
    public static pop<T = JSONValue>(obj: object, key: string, def?: T): T {
        const value = obj[key];
        delete obj[key];
        return value ?? def;
    }

    public static addInputsToScope(varValues: VarDefinition, varDefs: VarDefinition, scope: Scope): Scope {
        scope = JsonUtils.duplicateObject(scope);
        varDefs = JsonUtils.duplicateObject(varDefs);

        const isNestedDefinition = (o: unknown) => o !== null && typeof o === "object" && o[Constants.KEYWORD.nested];

        const iterate = (varValues: VarDefinition, varDefs: VarDefinition) => {
            // For all the arguments, replace with value from argValues if present
            for (let arg in varDefs) {
                // If pass null, use default value
                if (varValues[arg] === null) varValues[arg] = Constants.KEYWORD.default;

                // If value is defined and not default, use it
                if (varValues[arg] !== undefined && varValues[arg] !== Constants.KEYWORD.default) {
                    // If nested object definition, iterate through it
                    if (isNestedDefinition(varDefs[arg]))
                        varDefs[arg] = iterate(varValues[arg] as VarDefinition, varDefs[arg] as VarDefinition);
                    // Otherwise, use value directly
                    else varDefs[arg] = varValues[arg];
                }

                // If value is still not defined, throw error
                if (varDefs[arg] == null) throw new MissingInputError(arg);

                // Delete key if nested definition
                if (isNestedDefinition(varDefs[arg])) delete varDefs[arg][Constants.KEYWORD.nested];
            }

            return varDefs;
        };

        // Add arguments to scope
        scope.locals = iterate(varValues, varDefs);
        return scope;
    }

    public static addLocalsToScope(vars: VarDefinition[], scope: Scope): Scope {
        scope = JsonUtils.duplicateObject(scope);

        // Process and variables to scope
        for (const map of vars) {
            for (const key in map) {
                const value = map[key];

                scope.locals[key] = Utils.processExpressions(value, scope);
            }
        }
        return scope;
    }

    public static createScopeProxy(scope: Scope): Scope {
        const handler = (accessList: string[]): ProxyHandler<ScopeObjects> => {
            return {
                get: function (target: ScopeObjects, key: string) {
                    const value = target[key];
                    if (value !== undefined) accessList.push(key);
                    return value;
                }.bind(this),
                set: () => false,
                deleteProperty: () => false,
            };
        };

        if (scope.access === undefined) scope.access = { locals: [], objects: [] };

        const scopeProxy = {
            locals: new Proxy(scope.locals, handler(scope.access.locals)),
            objects: new Proxy(scope.objects, handler(scope.access.objects)),
            stack: scope.stack,
            access: scope.access,
        } as Scope;

        return scopeProxy;
    }

    public static evalWithScope(expression: string, scope: Scope, throwError = false) {
        const evalExpression = [
            // Save old globalThis
            "const oldGlobalThis = { ...globalThis };",
            // Add v keys to global scope
            "for(const key in l) globalThis[key] = l[key];",
            // Process expression
            `const _ = ${expression}`,
            // Restore old globalThis
            "for(const key in l) globalThis[key] = oldGlobalThis[key];",
            // Return result
            "_;",
        ].join(";");

        try {
            return function () {
                "use strict";
                // Used by eval
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                // No duplication because it is a read-only proxy
                const o = scope.objects;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const l = JsonUtils.duplicateObject(scope.locals);
                return eval(evalExpression);
            }.call({});
        } catch (e) {
            if (throwError) throw e;
            return undefined;
        }
    }

    public static processExpressions<T extends JSONValue>(data: T, scope: Scope): T {
        function replaceExpression(...args: string[]): string {
            const match = args[0]!;

            const fullExp = args[1] || args[2] || args[4] || args[5];
            const partialExp = args[3];

            const expression = fullExp || partialExp;

            // Ignore if not in both quotes and braces
            if (!expression) return match;

            // Try using the expression as key in arguments
            let value: JSONValue = scopeProxy.locals[expression];

            // If in braces and value not found, then evaluate expression
            if (typeof value === "undefined") value = Utils.evalWithScope(expression, scopeProxy);

            // If still no value, throw error
            if (typeof value === "undefined") throw new ExpressionEvaluationError(expression);

            // Keep quotes if value is a string
            if (fullExp && typeof value === "string") value = `"${value}"`;

            // Return value as string
            if (typeof value === "string") return value;
            return JSON.stringify(value);
        }

        const scopeProxy = Utils.createScopeProxy(scope);

        let dataAsString = typeof data === "string" ? data : JSON.stringify(data);
        dataAsString = dataAsString.replace(Constants.EXPRESSION_REGEX, replaceExpression);

        // Try parsing as JSON
        const returnData = () => {
            try {
                return JSON.parse(dataAsString) as T;
            } catch (e) {
                // Not a JSON object
            }
            // Try parsing as number
            try {
                const dataAsNumber = parseFloat(dataAsString);
                if (!Number.isNaN(dataAsNumber)) return dataAsNumber as T;
            } catch (e) {
                // Not a number
            }
            // Return as string
            return dataAsString as T;
        };

        return returnData();
    }

    public static ensureArray<T>(data: T | T[] | undefined): T[] {
        if (data === undefined) return [];
        return Array.isArray(data) ? data : [data];
    }
}
