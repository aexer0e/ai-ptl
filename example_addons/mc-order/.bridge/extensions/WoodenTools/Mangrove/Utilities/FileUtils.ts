import { FileSystem } from "@bridge-editor/compiler-plugin-types";
import { JSONObject } from "../../Crimson/Source/Types";
import JsonUtils from "./JsonUtils";

export default class FileUtils {
    public static readonly FILE_NAME_REGEX = RegExp(/(\/)?([^./]*)(\..*)?$/);

    // Boolean functions
    public static isJSONFile = (path: string) => path.endsWith(".json");
    public static isJSFile = (path: string) => path.endsWith(".js");
    public static isScriptFile = (path: string) => path.endsWith(".ts") || path.endsWith(".js");
    public static isPackFile = (path: string) => path.startsWith("BP/") || path.startsWith("RP/");

    // File reading
    public static async readFile(fileSystem: FileSystem, path: string) {
        // Read the file content
        let content: string | object | undefined;
        try {
            if (this.isJSONFile(path)) content = await this.readJSONFile(fileSystem, path);
            else content = await this.readTextFile(fileSystem, path);
        } catch (e) {
            // It's a completely virtual file
        }

        return content;
    }

    public static async tryReadFile(fileSystem: FileSystem, path: string) {
        const content = await this.readFile(fileSystem, path);
        return content ?? "";
    }

    public static async readJSONFile(fileSystem: FileSystem, path: string): Promise<JSONObject> {
        let text = await this.readTextFile(fileSystem, path);
        text = JsonUtils.stripCommentsFromText(text);
        return JSON.parse(text);
    }

    public static async readTextFile(fileSystem: FileSystem, path: string): Promise<string> {
        const file = await fileSystem.readFile(path);
        return await file?.text();
    }

    // Path manipulation
    public static directoryOf(path: string) {
        return path.substring(0, path.lastIndexOf("/") + 1);
    }

    public static sanitizePath(path: string) {
        // Remove leading slashes
        while (path.startsWith("/")) path = path.substring(1);
        // Remove trailing slashes
        while (path.endsWith("/")) path = path.substring(0, path.length - 1);
        // Replace backslashes with forward slashes
        path = path.replace(/\\/g, "/");
        // Replace invalid characters with underscores
        path = path.replace(/[?*:|<>"]/g, "_");
        // Replace multiple slashes with a single slash
        path = path.replace(/\/+/g, "/");

        return path;
    }

    public static getFileName(path: string) {
        return path.match(this.FILE_NAME_REGEX)![2];
    }

    public static filePathWithoutDot = (path: string) => path.replace(/^\.\//, "");
    public static filePathWithDot = (path: string) => `./${this.filePathWithoutDot(path)}`;
}
