import ErrorHandler from "../../../Mangrove/Errors/ErrorHandler";
import FileUtils from "../../../Mangrove/Utilities/FileUtils";
import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { CircularReferenceError, ObjectProcessError } from "../ErrorTypes";
import FileDependencies from "../FileDependencies";
import CrimsonObject from "../FileType/CrimsonObject";
import { JSONArray, JSONObject, MethodAction, ObjectFile, Scope, ScopeObjects } from "../Types";
import Utils from "../Utils";
import AbstractFileStore from "./AbstractFileStore";

export default class CrimsonObjectStore extends AbstractFileStore<CrimsonObject> {
    private actions: { [path: string]: MethodAction[] } = {};

    private scopeData: ScopeObjects = { $labels: {} };

    public get Actions() {
        return this.actions;
    }

    public get ScopeData() {
        return this.scopeData;
    }

    protected createScope(): Scope {
        return { objects: this.ScopeData, locals: {}, stack: [] };
    }

    protected importFile(data: ObjectFile, path: string) {
        const versions: JSONArray<JSONObject> = Utils.pop(data, Constants.KEYWORD.versions, []);

        if (versions.length === 0) return this.createObject(data, path);

        // Store locals as it will be used in each version
        const locals = Utils.ensureArray(data[Constants.KEYWORD.locals]);
        for (let v = 0; v < versions.length; v++) {
            const dupData = JsonUtils.duplicateObject(data);
            // Add variables set in version to end of locals
            dupData[Constants.KEYWORD.locals] = locals.concat([versions[v]]);

            // Add version to identifier
            dupData[Constants.KEYWORD.identifier] += `.$${v}`;

            this.createObject(dupData, path);
        }
    }

    private createObject(data: ObjectFile, path: string) {
        const cObject = new CrimsonObject(data, path);

        const identifier = cObject.Identifier;
        if (!identifier) return;

        this.Items[identifier] = cObject;
        this.pathDependencyMap[path] = cObject.FileDependencies;
    }

    public processObjects() {
        // Process expressions
        for (const identifier in this.items) {
            const scope = this.createScope();
            ErrorHandler.logConsoleErrors(() => this.processObjectExpressions(identifier, scope), "Crimson");
        }

        // Process calls
        for (const identifier in this.items) {
            const scope = this.createScope();
            ErrorHandler.logConsoleErrors(() => this.processObjectCall(identifier, scope), "Crimson");
        }
    }

    private processObjectExpressions(identifier: string, scope: Scope) {
        // Skip if object doesn't exist or has already been processed
        const cObject = this.items[identifier];
        if (!cObject) return;
        if (cObject.HasProcessedExpressions) return;

        // Detect circular dependencies
        if (scope.stack.includes(identifier)) {
            const chain = scope.stack.map((c) => `'${c}'`).join(" -> ");
            throw new CircularReferenceError(chain);
        } else scope.stack.push(identifier);

        // Process dependencies
        for (const dependency of cObject.Dependencies) this.processObjectExpressions(dependency, scope);

        // Process expressions and store variables
        scope = JsonUtils.duplicateObject(scope);

        ErrorHandler.extendConsoleErrors(() => cObject.processExpressions(scope), ObjectProcessError.with(identifier));

        this.scopeData[identifier] = cObject.Data;

        const labelData = this.scopeData[Constants.KEYWORD.labels] as JSONObject<JSONArray<JSONObject>>;
        for (const label of cObject.Labels) {
            if (!(label in labelData)) labelData[label] = [];
            labelData[label].push(cObject.Data);
        }
    }

    private processObjectCall(identifier: string, scope: Scope) {
        // Process call
        const cObject = this.items[identifier];
        const actions = ErrorHandler.extendConsoleErrors(
            () => cObject.processCall(scope),
            ObjectProcessError.with(identifier)
        );

        // Copy the actions to the store's actions
        // Each actions is stored in an array with the path as the key
        for (const action of actions) {
            let path = action.path;
            path = FileUtils.sanitizePath(path);

            if (!(path in this.actions)) this.actions[path] = [];
            this.actions[path].push(action);

            this.PathDependencyMap[path] ??= new FileDependencies();
            this.PathDependencyMap[path].addFile(cObject);
        }
    }
}
