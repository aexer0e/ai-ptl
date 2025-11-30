import { FileSystem, IDirEntry } from "@bridge-editor/compiler-plugin-types";
import ErrorHandler from "../../../Mangrove/Errors/ErrorHandler";
import FileUtils from "../../../Mangrove/Utilities/FileUtils";
import Constants from "../Constants";
import { ImportFileError } from "../ErrorTypes";
import AbstractFileType from "../FileType/AbstractFileType";
import { PathDependencyMap } from "../Types";

export default abstract class AbstractFileStore<T extends AbstractFileType> {
    protected directory: string;
    protected items: { [identifier: string]: T } = {};
    protected pathDependencyMap: PathDependencyMap = {};
    protected fileSystem: FileSystem;
    private processedPaths: string[] = [];

    public get Items() {
        return this.items;
    }

    public get PathDependencyMap() {
        return this.pathDependencyMap;
    }

    public getItemByPath(path: string) {
        return Object.values(this.items).find((i) => i.Path === path);
    }

    constructor(fileSystem: FileSystem, directory: string) {
        this.directory = directory;
        this.fileSystem = fileSystem;
    }

    public async importFiles() {
        await this.importFilesFromDirectory(Constants.EXTERNAL_CRIMSON_DIRECTORY);
        await this.importFilesFromDirectory(Constants.INTERNAL_CRIMSON_DIRECTORY);
    }

    private async importFilesFromDirectory(crimsonDirectory: string) {
        let namespaces: IDirEntry[];
        try {
            namespaces = await this.fileSystem.readdir(`.${crimsonDirectory}`);
        } catch (error) {
            console.error(`Error reading namespaces from ${crimsonDirectory}: ${error}`);
            return; // Exit the function if there's an error
        }

        // Loop through namespaces in Crimson directory
        for (const namespace of namespaces) {
            if (namespace.kind !== "directory") continue;

            // Loop through appropriate subfolder in namespace
            const directory = `./${crimsonDirectory}/${namespace.name}/${this.directory}`;
            const paths = await this.readdirAsArray(directory);

            for (const path of paths) {
                const sanitizedPath = FileUtils.sanitizePath(path);
                await ErrorHandler.logConsoleErrorsAsync(() => this.importFileAtPath(sanitizedPath), "Crimson");
            }
        }
    }

    public async importFileAtPath(path: string) {
        if (!FileUtils.isJSONFile(path)) return;
        if (this.processedPaths.includes(path)) return;

        const data = await FileUtils.tryReadFile(this.fileSystem, path);
        if (!data) return ErrorHandler.warn(`Cannot read file '${path}'`, "Crimson");

        ErrorHandler.extendConsoleErrors(() => this.importFile(data as object, path), ImportFileError.with(path));
        this.processedPaths.push(path);
    }

    protected abstract importFile(data: object, path?: string): void;

    public async readdirAsArray(directory: string = this.directory) {
        let output: string[] = [];
        let files: IDirEntry[] = [];

        try {
            files = await this.fileSystem.readdir(directory);
        } catch (e) {
            return output;
        }

        for (let file of files) {
            const path = `${directory}/${file.name}`;

            if (file.kind == "file") output.push(path);
            else {
                const subOutput = await this.readdirAsArray(path);
                output.push(...subOutput);
            }
        }

        return output;
    }
}
