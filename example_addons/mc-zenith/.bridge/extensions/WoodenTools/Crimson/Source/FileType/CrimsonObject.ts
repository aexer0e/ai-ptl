import { ConsoleError } from "../../../Mangrove/Errors/ErrorTypes";
import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { LabelReferenceInObjectError, MissingKeyError } from "../ErrorTypes";
import FileStore from "../FileStore/FileStore";
import { CallObject, JSONObject, MethodAction, ObjectFile, Scope } from "../Types";
import Utils from "../Utils";
import AbstractFileType from "./AbstractFileType";
import CrimsonCallHandler from "./CrimsonCallHandler";

export default class CrimsonObject extends AbstractFileType<ObjectFile> {
    protected dependencies: string[];
    protected hasProcessedExpressions: boolean;
    protected locals: JSONObject[] = [];
    protected versions: JSONObject[];
    protected labels: string[];
    protected outputs: JSONObject;
    protected context: string;

    public get Dependencies() {
        return this.dependencies;
    }

    public get HasProcessedExpressions() {
        return this.hasProcessedExpressions;
    }

    public get Labels() {
        return this.labels;
    }

    constructor(data: ObjectFile, path: string) {
        data = JsonUtils.duplicateObject(data);
        super(data, path);

        this.identifier = this.data[Constants.KEYWORD.identifier] as string;
        if (!this.identifier) throw new MissingKeyError(Constants.KEYWORD.identifier, "Object");

        // Pop dependencies
        const dependencies = Utils.pop<string[]>(this.data, Constants.KEYWORD.dependencies, []);
        this.dependencies = Utils.ensureArray(dependencies);

        // Extract dependencies
        const extractedDependencies = this.extractObjectDependencies(this.data);
        this.dependencies.push(...extractedDependencies);

        // Pop locals
        const locals = Utils.pop<JSONObject[]>(this.data, Constants.KEYWORD.locals, []);
        this.locals = Utils.ensureArray(locals);

        // Pop labels
        const labels = Utils.pop<string[]>(this.data, Constants.KEYWORD.labels, []);
        this.labels = Utils.ensureArray(labels);

        // Pop outputs and context
        this.outputs = Utils.pop<JSONObject>(this.data, Constants.KEYWORD.outputs, {});
        this.context = Utils.pop<string>(this.data, Constants.KEYWORD.context, "");
    }

    public processExpressions(scope: Scope) {
        if (this.hasProcessedExpressions) return;

        // Process locals
        scope = Utils.addLocalsToScope(this.locals, scope);

        this.data = Utils.processExpressions(this.data, scope);

        // Add dependent files
        for (const d of this.dependencies) this.fileDependencies.addFile(FileStore.Object.Items[d]);
        this.fileDependencies.addFilesFromScopeAccess(scope.access!);

        this.hasProcessedExpressions = true;
    }

    public processCall(scope: Scope) {
        let actions: MethodAction[] = [];

        // If method, process method call
        const method = this.data[Constants.KEYWORD.method] as string;
        if (method) {
            // Force to be a method call
            const data = JsonUtils.duplicateObject(this.data);
            data["$type"] = "method";

            // Copy object identifier
            data["$object"] = this.identifier;

            // Process call
            const handler = new CrimsonCallHandler(data as CallObject);
            let returns = handler.process(scope, this.fileDependencies);

            if (!returns) returns = {};
            if (!returns.actions) returns.actions = [];
            if (!returns.outputs) returns.outputs = {};

            // Add context to outputs
            if (this.context) returns.outputs = { [this.context]: returns.outputs };
            scope.locals = { ...scope.locals, ...returns.outputs };

            // Set actions
            actions = returns.actions;
        }

        // Log outputs
        if (Object.keys(this.outputs).length > 0) {
            scope = Utils.addLocalsToScope(this.locals, scope);

            const processedOutputs = Utils.processExpressions(this.outputs, scope);

            this.fileDependencies.addFilesFromScopeAccess(scope.access!);

            console.log(`(Crimson) Output for object '${this.identifier}':`, processedOutputs);
        }

        // Return actions
        return actions;
    }

    private extractObjectDependencies(data: JSONObject): string[] {
        // Create a proxy handler that logs all access to the object
        const accessList: string[] = [];
        const falseHandler = { get: () => false, set: () => false, deleteProperty: () => false };
        const accessHandler = {
            ...falseHandler,
            get: (_: any, key: string) => {
                if (key == Constants.KEYWORD.labels) throw new LabelReferenceInObjectError(this.identifier);
                accessList.push(key);
            },
        };
        const scopeProxy = {
            locals: new Proxy({}, falseHandler),
            objects: new Proxy({}, accessHandler),
        } as Scope;

        // Process each expression in the object
        for (const match of JSON.stringify(data).matchAll(Constants.EXPRESSION_REGEX)) {
            const expression = match[1] || match[2] || match[3] || match[4] || match[5];

            try {
                Utils.evalWithScope(expression, scopeProxy, true);
            } catch (e) {
                // Only throw console errors
                if (e instanceof ConsoleError) throw e;
            }
        }

        // Return the list of accessed objects
        return accessList;
    }
}
