import Constants from "../Constants";
import { TemplateFile } from "../Types";
import Utils from "../Utils";
import CrimsonTemplate from "./CrimsonTemplate";

export default class CrimsonGlobalTemplate extends CrimsonTemplate {
    private directories: string[];

    public get Directories() {
        return this.directories;
    }

    constructor(data: TemplateFile, path: string) {
        super(data, path);

        // Create a unique identifier
        this.identifier = crypto.randomUUID();

        // Pop global directories
        const directories = Utils.pop<string[]>(this.data, Constants.KEYWORD.global, []);
        this.directories = Utils.ensureArray(directories);
    }
}
