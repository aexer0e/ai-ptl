import { TCompilerPluginFactory } from "@bridge-editor/compiler-plugin-types";
import FileUtils from "../Mangrove/Utilities/FileUtils";
import Constants from "./Source/Constants";
import SaplangManager from "./Source/SaplangManager";

// Initialize
let saplangManager: SaplangManager = new SaplangManager();
const isSaplangFile = (filePath: string) => filePath.endsWith(Constants.FILE_EXTENSION);
const isLangFile = (filePath: string) => filePath === Constants.LANG_PATH;

// Export
const factory: TCompilerPluginFactory = (context) => {
    return {
        async buildStart() {
            const isBuild = context.options.buildType === "fullBuild";
            saplangManager.reset(isBuild);
        },
        async transformPath(filePath: string) {
            // Don't transform Saplang files
            if (isSaplangFile(filePath)) return null;
        },
        async include() {
            return [[Constants.LANG_PATH, { isVirtual: false }]];
        },
        async read(filePath: string) {
            // Read lang and saplang file
            if (isLangFile(filePath)) return await FileUtils.tryReadFile(context.fileSystem, filePath);
            if (isSaplangFile(filePath)) return await FileUtils.tryReadFile(context.fileSystem, filePath);
        },
        async require(filePath: string) {
            if (isLangFile(filePath)) return [`**/*${Constants.FILE_EXTENSION}`];
        },
        async transform(filePath: string, fileContent: any) {
            if (isSaplangFile(filePath)) saplangManager.addFile(filePath, fileContent);

            if (isLangFile(filePath) && saplangManager.hasFiles()) {
                // Add Saplang file content to lang file
                fileContent = fileContent + "\n\n" + saplangManager.toLang();

                // Remove trailing newlines
                fileContent = fileContent.trim();
                return fileContent;
            }
        },
    };
};

export default factory;
