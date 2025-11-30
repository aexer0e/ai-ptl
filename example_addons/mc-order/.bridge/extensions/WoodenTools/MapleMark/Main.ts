import { TCompilerPluginFactory } from "@bridge-editor/compiler-plugin-types";
import FileUtils from "../Mangrove/Utilities/FileUtils";
import JsonUtils from "../Mangrove/Utilities/JsonUtils";

const VANILLA_PATH = "RP/ui/hud_screen.json";
const DASH_PATH = "/.bridge/extensions/WoodenTools/MapleMark/hud_screen.json";

// Creates a script containing current environment
const factory: TCompilerPluginFactory<{ text?: string }> = ({ options, fileSystem }) => {
    return {
        async include() {
            return [[VANILLA_PATH, { isVirtual: true }]];
        },
        async read(filePath: string) {
            if (filePath !== VANILLA_PATH) return;
            return FileUtils.tryReadFile(fileSystem, filePath);
        },
        async transform(filePath: string, content: object) {
            if (filePath !== VANILLA_PATH) return;

            const newContent = await FileUtils.readJSONFile(fileSystem, DASH_PATH);
            if (!newContent) return content;

            newContent["gm1_maple__label"]!["text"] = options.text ?? "build.id";

            if (!content) return newContent;

            return JsonUtils.mergeJSON(newContent, content);
        },
        async finalizeBuild(filePath: string, content: object) {
            if (filePath !== VANILLA_PATH) return;
            if (typeof content === "string") return content;
            return JSON.stringify(content, null, 4);
        },
    };
};

export default factory;
