import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { JSONObject, Scope, TemplateFile } from "../Types";
import Utils from "../Utils";
import AbstractFileType from "./AbstractFileType";

export default class CrimsonTemplate extends AbstractFileType<TemplateFile> {
    protected inputs: JSONObject = {};
    protected locals: JSONObject[] = [];

    constructor(data: TemplateFile, path: string) {
        data = JsonUtils.duplicateObject(data);
        super(data, path);

        delete this.data[Constants.KEYWORD.identifier];

        this.inputs = Utils.pop(this.data, Constants.KEYWORD.inputs, {});

        const locals = Utils.pop<JSONObject[]>(this.data, Constants.KEYWORD.locals, []);
        this.locals = Utils.ensureArray(locals);
    }

    public process(argValues: JSONObject, scope: Scope) {
        // Add defined arguments and variables to scope
        scope = Utils.addInputsToScope(argValues, this.inputs, scope);
        scope = Utils.addLocalsToScope(this.locals, scope);
        scope.stack.push(this.identifier);

        // Process expressions in data and clean up
        const data = Utils.processExpressions(this.data, scope);
        this.fileDependencies.addFilesFromScopeAccess(scope.access!);

        return data;
    }
}
