import { TCompilerPluginFactory } from "@bridge-editor/compiler-plugin-types";

const buildFileContent = (environment) => `export default "${environment}";` + "\r\n";
const ENV_PATH = "BP/scripts/.env.ts";

// Creates a script containing current environment
const factory: TCompilerPluginFactory = ({ options, fileSystem }) => {
    return {
        async buildStart() {
            // Create a file with the current environment as dev
            await fileSystem.writeFile(ENV_PATH, buildFileContent("dev"));
        },
        async include() {
            return [[ENV_PATH, { isVirtual: true }]];
        },
        async read(filePath) {
            if (filePath.endsWith(ENV_PATH)) return "";
        },
        async transform(filePath) {
            const mode = options.mode;
            if (!filePath.endsWith(ENV_PATH)) return;

            // Update file content based on current environment
            return buildFileContent(mode === "production" ? "prod" : "dev");
        },
    };
};

export default factory;
