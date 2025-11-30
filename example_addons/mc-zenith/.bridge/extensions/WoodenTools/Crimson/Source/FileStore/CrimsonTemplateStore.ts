import Constants from "../Constants";
import CrimsonGlobalTemplate from "../FileType/CrimsonGlobalTemplate";
import CrimsonStandardTemplate from "../FileType/CrimsonStandardTemplate";
import CrimsonTemplate from "../FileType/CrimsonTemplate";
import { TemplateFile } from "../Types";
import AbstractFileStore from "./AbstractFileStore";

export default class CrimsonTemplateStore extends AbstractFileStore<CrimsonTemplate> {
    protected globals: { [path: string]: string[] } = {};

    public get Globals() {
        return this.globals;
    }

    importFile(data: TemplateFile, path: string) {
        const isGlobal = Constants.KEYWORD.global in data;
        let cTemplate = isGlobal ? new CrimsonGlobalTemplate(data, path) : new CrimsonStandardTemplate(data, path);

        const identifier = cTemplate.Identifier;
        if (identifier) this.items[identifier] = cTemplate;

        this.pathDependencyMap[path] = cTemplate.FileDependencies;

        if (!isGlobal) return;

        // Store names of global templates with the directories they are in
        const directories = (cTemplate as CrimsonGlobalTemplate).Directories;
        const globals = this.globals;
        for (const dir of directories) {
            if (!(dir in globals)) globals[dir] = [];
            globals[dir].push(identifier);
        }
    }
}
