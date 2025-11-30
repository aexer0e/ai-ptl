import AbstractFileStore from "./AbstractFileStore";

import { FileSystem } from "@bridge-editor/compiler-plugin-types";
import { ImportFileError } from "../ErrorTypes";
import CrimsonMethod from "../FileType/CrimsonMethod";
import { MethodFile } from "../Types";

import ErrorHandler from "../../../Mangrove/Errors/ErrorHandler";

import ExternalMethods from "../../../../../../crimson/_methods";
import InternalMethod from "../../Collections/_methods";
const scriptMethods: MethodFile[] = [...ExternalMethods, ...InternalMethod];

export default class CrimsonMethodStore extends AbstractFileStore<CrimsonMethod> {
    constructor(fileSystem: FileSystem, directory: string) {
        super(fileSystem, directory);

        for (const script of scriptMethods) this.importScript(script);
    }

    private importScript(data: MethodFile) {
        ErrorHandler.extendAndLogConsoleErrors(
            () => this.importFile(data, ""),
            ImportFileError.with(data.$identifier),
            "Crimson"
        );
    }

    importFile(data: MethodFile, path: string) {
        const cMethod = new CrimsonMethod(data, path);

        const identifier = cMethod.Identifier;
        if (!identifier) return;

        this.items[identifier] = cMethod;
        this.pathDependencyMap[path] = cMethod.FileDependencies;
    }
}
