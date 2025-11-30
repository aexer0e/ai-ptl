import { FileSystem } from "@bridge-editor/compiler-plugin-types";
import FileUtils from "../../Mangrove/Utilities/FileUtils";
import JsonUtils from "../../Mangrove/Utilities/JsonUtils";
import Constants from "./Constants";
import FileStore from "./FileStore/FileStore";
import { JSONValue, PathDependencyMap } from "./Types";

export default class FileHandler {
    private fileSystem: FileSystem;
    private dependents: { [key: string]: string[] } = {};

    constructor(fileSystem: FileSystem) {
        this.fileSystem = fileSystem;
    }

    public get Dependents() {
        return this.dependents;
    }

    public isActionedFile = (path: string) => path in FileStore.Object.Actions;
    public isInPackage = (path: string) => path.includes("BP/") || path.includes("RP/");

    public shouldHandleReadWrite(path: string) {
        // Read RP JSON files as dash doesn't do this automatically
        if (Constants.RP_JSON_REGEX.test(path)) return true;
        if (path in FileStore.Object.Actions) return true;
        return false;
    }

    public async applyActions(filePath: string, content: any) {
        let actionContents: JSONValue[] = FileStore.Object.Actions[filePath]
            // Convert action to their content
            .map((o) => o.content)
            // Filter out undefined values
            .filter((c) => typeof c !== undefined);

        // If it's a JS file, import the content and get the default export
        if (FileUtils.isJSFile(filePath)) {
            const contentImport = await import(`data:application/javascript;base64,${btoa(content as string)}`);
            content = contentImport.default;
        }

        // If content is undefined, use the first action as the content
        if (content === undefined || content === "") content = actionContents.shift();

        // If content is an object, merge the action with it
        if (typeof content === "object") return JsonUtils.mergeJSONArray(content, actionContents as object[]);
        // If it's a string, return the content with the action appended
        else return `${content}${actionContents.join("")}`;
    }

    public finalizeFile(filePath: string, fileContent: any) {
        const isJS = FileUtils.isJSFile(filePath);

        // Return if its a non-JS string, or a JS file with an export default statement
        if (typeof fileContent === "string" && (!isJS || fileContent.startsWith("export default"))) return;

        // Convert the file content to a string if not already
        let contentAsString = typeof fileContent === "string" ? fileContent : JSON.stringify(fileContent, null);
        // If it's a JS file, add the export default statement
        if (FileUtils.isJSFile(filePath)) contentAsString = `export default ${contentAsString};`;
        return contentAsString;
    }

    public updateDependentMap(map: PathDependencyMap) {
        for (const path in map) {
            const dependencies = map[path];
            for (let dependencyPath of dependencies.Paths) {
                this.dependents[dependencyPath] ??= [];
                this.dependents[dependencyPath].push(path);
            }
        }
    }
}
