import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { CircularReferenceError, MissingKeyError } from "../ErrorTypes";
import { Calls, MethodAction, MethodFile, MethodReturn, Scope, VarDefinition } from "../Types";
import Utils from "../Utils";
import AbstractFileType from "./AbstractFileType";
import CrimsonCallHandler from "./CrimsonCallHandler";

export default class CrimsonMethod extends AbstractFileType<MethodFile> {
    protected calls: Calls;
    protected inputs: VarDefinition = { [Constants.KEYWORD.object]: null };
    protected outputs: VarDefinition = {};
    protected locals: VarDefinition[] = [];

    constructor(data: MethodFile, path: string) {
        data = JsonUtils.duplicateObject(data);
        super(data, path);

        // Identifier
        this.identifier = this.data[Constants.KEYWORD.identifier];
        if (!this.identifier) throw new MissingKeyError(Constants.KEYWORD.identifier, "Method");

        // Inputs
        const inputs = this.data[Constants.KEYWORD.inputs] ?? {};
        this.inputs = { ...this.inputs, ...inputs };

        // Locals
        const locals = Utils.pop<VarDefinition[]>(this.data, Constants.KEYWORD.locals, []);
        this.locals = Utils.ensureArray(locals);

        // Calls
        this.calls = this.data[Constants.KEYWORD.calls] ?? [];

        // Outputs
        this.outputs = this.data[Constants.KEYWORD.outputs] ?? {};
    }

    public process(inputValues: VarDefinition, scope: Scope): MethodReturn {
        const inputs = this.inputs;
        const outputs = this.outputs;
        const identifier = this.identifier;
        let calls = this.calls;

        // Add defined inputs to scope, and increment depth
        scope = Utils.addInputsToScope(inputValues, inputs, scope);
        scope = Utils.addLocalsToScope(this.locals, scope);

        // Detect circular references
        if (scope.stack.includes(identifier)) {
            const chain = scope.stack.map((c) => `'${c}'`).join(" -> ");
            throw new CircularReferenceError(chain);
        } else scope.stack.push(identifier);

        // Process each method
        const actions: MethodAction[] = [];

        // If call is a script function, call it and get the calls
        if (typeof calls === "function") calls = calls(scope);

        // If call is an object, ensure it is  an array
        const callsAsArray = Utils.ensureArray(calls);

        for (const call of callsAsArray) {
            const dupCall = JsonUtils.duplicateObject(call);
            const context: string | undefined = Utils.pop<string>(dupCall, Constants.KEYWORD.context);

            const dupScope = JsonUtils.duplicateObject(scope);
            const callHandler = new CrimsonCallHandler(dupCall);
            const returns = callHandler.process(dupScope);

            if (!returns) continue;
            if (returns.actions) actions.push(...returns.actions);
            if (returns.outputs) {
                let outputs = returns.outputs;
                if (context) outputs = { [context]: outputs };
                scope.locals = { ...scope.locals, ...outputs };
            }
        }

        // Process outputs with new scope
        const processedOutputs = Utils.processExpressions(outputs, scope);
        this.fileDependencies.addFilesFromScopeAccess(scope.access!);

        return {
            actions,
            outputs: processedOutputs,
        };
    }
}
