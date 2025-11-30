import ErrorHandler from "../../../Mangrove/Errors/ErrorHandler";
import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { GarbledJSONError, MissingKeyError, TemplateProcessError, UnknownTemplateError } from "../ErrorTypes";
import FileStore from "../FileStore/FileStore";
import { JSONObject, Scope, TemplateCall, TemplateCallObject, VanillaFile, VarDefinition } from "../Types";
import Utils from "../Utils";
import AbstractFileType from "./AbstractFileType";

export default class CrimsonVanilla extends AbstractFileType<VanillaFile> {
    protected locals: JSONObject[] = [];

    constructor(data: VanillaFile, path: string) {
        super(data, path);

        this.identifier = path;

        const locals = Utils.pop<VarDefinition[]>(this.data, Constants.KEYWORD.locals, []);
        this.locals = Utils.ensureArray(locals);
    }

    public process(scope: Scope): object {
        // Process expressions

        scope = Utils.addLocalsToScope(this.locals, scope);
        let data = Utils.processExpressions(this.data, scope);
        if(typeof data !== "object") throw new GarbledJSONError(data); 

        if (scope.access) this.fileDependencies.addFilesFromScopeAccess(scope.access);

        // Get template calls
        let templateCalls = this.popTemplateCalls(data);

        // Add all relevant global templates to template calls
        for (const path in FileStore.Template.Globals) {
            if (this.identifier.startsWith(path)) {
                const templates = FileStore.Template.Globals[path];
                templateCalls = templateCalls.concat(this.convertToObjectTemplateCallArray(templates));
            }
        }

        // Merge every template
        const reverseCalls = templateCalls.reverse();
        let mergedTemplateData: object = {};
        for (let templateCall of reverseCalls) {
            // Get template identifier and arguments
            const identifier = Utils.pop<string>(templateCall, Constants.KEYWORD.template);

            if (!identifier) throw new MissingKeyError(Constants.KEYWORD.template, "Template Call");

            const template = FileStore.Template.Items[identifier];
            if (!template) throw new UnknownTemplateError(identifier);

            this.fileDependencies.addFile(template);

            const args = templateCall;
            const dupScope = JsonUtils.duplicateObject(scope);
            const templateData = ErrorHandler.extendConsoleErrors(
                () => template.process(args, dupScope),
                TemplateProcessError.with(identifier)
            );
            mergedTemplateData = JsonUtils.mergeJSON(templateData, mergedTemplateData);
        }

        // Merge template data with original data
        data = JsonUtils.mergeJSON(mergedTemplateData, data);

        // Log duplicates
        if (Constants.KEYWORD.logging in data) {
            const logging = Utils.pop(data, Constants.KEYWORD.logging);
            if (logging) this.logDuplicates(data);
        }

        return data;
    }

    private popTemplateCalls(data: object): TemplateCallObject[] {
        const key = Constants.KEYWORD.templates;
        if (!(key in data)) return [];

        let templateCalls = Utils.pop(data, key, []);
        return this.convertToObjectTemplateCallArray(templateCalls);
    }

    private convertToObjectTemplateCallArray(templateCalls: TemplateCall[] | TemplateCall) {
        // If only a single template call, make it an array
        templateCalls = Utils.ensureArray(templateCalls);

        // Convert all parents without arguments to key-value maps
        for (let i = 0; i < templateCalls.length; i++) {
            const parent = templateCalls[i];
            if (typeof parent === "string") templateCalls[i] = { $template: parent };
        }

        return JsonUtils.duplicateObject(templateCalls) as TemplateCallObject[];
    }

    private logDuplicates(data: any, keys: string = "") {
        if (typeof data != "object") return;

        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (data.indexOf(data[i]) != i) {
                    ErrorHandler.warn(
                        `Multiple instances of '${data[i]}' found at ${this.identifier}/${keys}`,
                        "Crimson"
                    );
                }

                this.logDuplicates(data[i], `${keys}/${i}`);
            }
        } else {
            for (let key in data) this.logDuplicates(data[key], `${keys}/${key}`);
        }
    }
}
