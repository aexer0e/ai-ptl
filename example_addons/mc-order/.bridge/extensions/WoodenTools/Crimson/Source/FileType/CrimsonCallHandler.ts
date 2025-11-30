import ErrorHandler from "../../../Mangrove/Errors/ErrorHandler";
import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { MethodProcessError, MissingKeyError, UnknownCallTypeError, UnknownMethodError } from "../ErrorTypes";
import FileDependencies from "../FileDependencies";
import FileStore from "../FileStore/FileStore";
import { ActionCallObject, CallObject, MethodCallObject, MethodReturn, Scope, VariableCallObject } from "../Types";
import Utils from "../Utils";

export default class CrimsonCallHandler {
    protected data: CallObject;
    private callType: string;

    constructor(data: CallObject) {
        this.data = JsonUtils.duplicateObject(data);

        this.callType = Utils.pop<string>(data, Constants.KEYWORD.call, "method");
    }

    public process(scope: Scope, fileDependencies?: FileDependencies): MethodReturn {
        // Process condition
        const condition = this.data[Constants.KEYWORD.condition];
        if (condition !== undefined) {
            const processedCondition = Utils.processExpressions(condition, scope);
            if (processedCondition === false) return {};
        }

        // Process expressions
        const data = Utils.processExpressions(this.data, scope);
        fileDependencies?.addFilesFromScopeAccess(scope.access!);

        // Auto-assign identifier if not already set
        const objectKey = Constants.KEYWORD.object;
        if (!data[objectKey] && scope.locals[objectKey]) data[objectKey] = scope.locals[objectKey];

        // Process call
        switch (this.callType) {
            case "method":
                return this.processMethodCall(data as MethodCallObject, scope, fileDependencies);
            case "action":
                return this.processActionCall(data as ActionCallObject);
            case "variable":
            case "locals":
                return this.processVariableCall(data as VariableCallObject);
            default:
                throw new UnknownCallTypeError(this.callType);
        }
    }

    public processVariableCall(data: VariableCallObject): MethodReturn {
        return { outputs: data };
    }

    public processActionCall(data: ActionCallObject): MethodReturn {
        let path = data[Constants.KEYWORD.path] as string;
        if (!path) throw new MissingKeyError(Constants.KEYWORD.path, "Action Call");

        let content = data[Constants.KEYWORD.content];
        if (typeof content === "undefined") throw new MissingKeyError(Constants.KEYWORD.content, "Action Call");

        let lines = data[Constants.KEYWORD.lines] ?? false;

        if (lines) {
            // If not object or array, convert to string
            if (typeof content !== "object") content = content.toString();
            // If array, join with newlines
            else if (Array.isArray(content)) content = content.join("\n");
            // If object, stringify
            else content = JSON.stringify(content);

            // Add newline to end
            content = content + "\n";
        }

        return { actions: [{ path, content }] };
    }

    public processMethodCall(data: MethodCallObject, scope: Scope, fileDependencies?: FileDependencies): MethodReturn {
        // Determine if method or leaf call
        const dupData = JsonUtils.duplicateObject(data);
        const methodType = Utils.pop<string>(dupData, Constants.KEYWORD.method);
        const method = FileStore.Method.Items[methodType];

        if (!method) throw new UnknownMethodError(methodType);

        if (fileDependencies) fileDependencies.addFile(method);

        return ErrorHandler.extendConsoleErrors(
            () => method.process(dupData, scope),
            MethodProcessError.with(methodType)
        );
    }
}
