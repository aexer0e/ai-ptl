import { TCompilerPlugin, TCompilerPluginFactory } from "@bridge-editor/compiler-plugin-types";
import ErrorHandler from "../Mangrove/Errors/ErrorHandler";
import FileUtils from "../Mangrove/Utilities/FileUtils";
import SaplangConstants from "../Saplang/Source/Constants";
import Constants from "./Source/Constants";
import { SaplangRegisterError, VanillaProcessError } from "./Source/ErrorTypes";
import FileHandler from "./Source/FileHandler";
import CrimsonMethodStore from "./Source/FileStore/CrimsonMethodStore";
import CrimsonObjectStore from "./Source/FileStore/CrimsonObjectStore";
import CrimsonTemplateStore from "./Source/FileStore/CrimsonTemplateStore";
import FileStore from "./Source/FileStore/FileStore";
import CrimsonVanilla from "./Source/FileType/CrimsonVanilla";
import { requireBuild } from "./Source/RequireBuild";
import { PathDependencyMap, Scope } from "./Source/Types";

// Define variables
let fileHandler: FileHandler;
let runtimeDependencies: PathDependencyMap = {};
let hasBuilt = false;
let filesToCompile: string[] = [];
let requireBuildReasons: { [path: string]: string } = {};

// Export the plugin
const factory: TCompilerPluginFactory = (context) => {
    const plugin = {
        async buildStart() {
            // Initialize the file system
            const fileSystem = context.fileSystem;
            fileHandler = new FileHandler(fileSystem);

            FileStore.Template = new CrimsonTemplateStore(fileSystem, Constants.TEMPLATE_DIRECTORY);
            FileStore.Method = new CrimsonMethodStore(fileSystem, Constants.METHOD_DIRECTORY);
            FileStore.Object = new CrimsonObjectStore(fileSystem, Constants.OBJECT_DIRECTORY);

            await FileStore.Template.importFiles();
            await FileStore.Method.importFiles();
            await FileStore.Object.importFiles();

            FileStore.Object.processObjects();

            fileHandler.updateDependentMap(runtimeDependencies);
            fileHandler.updateDependentMap(FileStore.Object.PathDependencyMap);
            fileHandler.updateDependentMap(FileStore.Method.PathDependencyMap);
            fileHandler.updateDependentMap(FileStore.Template.PathDependencyMap);

            // Handle build type
            const buildType = context.options.buildType;
            if (buildType === "fullBuild") {
                runtimeDependencies = {};
                requireBuildReasons = {};
                hasBuilt = true;
            } else if (!hasBuilt) {
                ErrorHandler.warn("You must build the project before you can use watch mode", "Crimson");
            }

            filesToCompile = [];

            // Check if Saplang is registered
            const plugins = context.projectConfig.data.compiler.plugins;
            const saplangIndex = plugins.indexOf("woodenTools.Saplang");
            const crimsonIndex = plugins.indexOf("woodenTools.Crimson");
            if (saplangIndex < crimsonIndex) throw new SaplangRegisterError();
        },

        async include() {
            // Include all the files to be created by Crimson as virtual files
            return Object.keys(FileStore.Object.Actions).map((path) => [path, { isVirtual: true }]);
        },
        async transformPath(filePath: string) {
            const filePathWithoutDot = FileUtils.filePathWithoutDot(filePath);
            const filePathWithDot = FileUtils.filePathWithDot(filePath);

            // If not crimson, return the file path
            const isExternalCrimsonFile = filePathWithoutDot.startsWith(Constants.EXTERNAL_CRIMSON_DIRECTORY.slice(1));
            const isInternalCrimsonFile = filePathWithoutDot.startsWith(Constants.INTERNAL_CRIMSON_DIRECTORY.slice(1));
            if (!isExternalCrimsonFile && !isInternalCrimsonFile) return filePath;

            // If full build, and is a crimson file, return null
            if (context.options.buildType === "fullBuild") return null;

            const crimsonFile = FileStore.getByPath(filePathWithDot);
            if (!crimsonFile) return filePath;

            // Recompile the dependent files
            const getFilesToCompile = (path: string, dependents: Set<string> = new Set<string>()) => {
                const newDependents = fileHandler.Dependents[path] ?? [];
                for (const dependent of newDependents) {
                    if (!dependents.has(path)) getFilesToCompile(dependent, dependents);

                    // Crimson file does not be to be recompiled, as they are compiled in buildStart
                    const isCrimsonFile = FileStore.getByPath(dependent) !== undefined;
                    if (!isCrimsonFile) dependents.add(dependent);
                }
                return dependents;
            };

            const dependents = getFilesToCompile(filePathWithDot);
            filesToCompile = filesToCompile.concat([...dependents]);

            return null;
        },

        async read(filePath: string) {
            // Handle file reading
            if (!fileHandler.shouldHandleReadWrite(filePath)) return null;
            return await FileUtils.tryReadFile(context.fileSystem, filePath);
        },

        async load(filePath: string, fileContent: any) {
            // Process actions on the file content
            if (fileHandler.isActionedFile(filePath))
                fileContent = await fileHandler.applyActions(filePath, fileContent);

            const reasonForRebuild = requireBuild(filePath, fileContent);
            if (reasonForRebuild) requireBuildReasons[filePath] = reasonForRebuild;

            // Only process vanilla JSON files from now on
            if (typeof fileContent !== "object") return fileContent;
            if (!filePath.match(Constants.VANILLA_JSON_REGEX)) return fileContent;

            // Process the file content
            const child = new CrimsonVanilla(fileContent, filePath);
            const scope: Scope = {
                objects: FileStore.Object.ScopeData,
                locals: {},
                stack: [],
            };

            // Log any errors process
            const newFileContent = ErrorHandler.extendAndLogConsoleErrors(
                () => child.process(scope),
                VanillaProcessError.with(filePath),
                "Crimson"
            );

            if (!newFileContent) return fileContent;

            runtimeDependencies[filePath] = child.FileDependencies;

            return newFileContent;
        },
        async finalizeBuild(filePath: string, fileContent: any) {
            // Handle file writing
            if (!fileHandler.shouldHandleReadWrite(filePath)) return fileContent;
            return fileHandler.finalizeFile(filePath, fileContent);
        },
        async buildEnd() {
            const uniqueFilesToCompile = [...new Set(filesToCompile)];
            filesToCompile = [];

            if (uniqueFilesToCompile.length === 0) return;

            // If recompiling a saplang file, also recompile the lang file
            if (uniqueFilesToCompile.some((f) => f.endsWith(SaplangConstants.FILE_EXTENSION))) {
                uniqueFilesToCompile.push(SaplangConstants.LANG_PATH);
            }

            // Log the files to recompile
            console.log(JSON.stringify({ crimsonFiles: uniqueFilesToCompile }, null, 2));

            // Some files do not work with compileFiles, such as those with custom components
            for (const path of uniqueFilesToCompile) {
                if (path in requireBuildReasons) {
                    ErrorHandler.warn(`You must rebuild the project: ${requireBuildReasons[path]}`, "Crimson");
                    break;
                }
            }
            await context.compileFiles(uniqueFilesToCompile, true);
        },
    };

    return plugin as TCompilerPlugin;
};

export default factory;
