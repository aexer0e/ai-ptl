import ErrorHandler from "../../Mangrove/Errors/ErrorHandler";
import { LangProcessingError } from "./ErrorTypes";
import SaplangFile from "./SaplangFile";
import { Term } from "./Types";

export default class SaplangManager {
    public cachedFiles: { [path: string]: SaplangFile } = {};
    public files: { [path: string]: SaplangFile } = {};
    public filesAccessed: string[] = [];

    // Add file to array but not necessarily process it
    public addFile(path: string, content: string) {
        if (content) {
            this.cachedFiles[path] = new SaplangFile(path);
            ErrorHandler.extendAndLogConsoleErrors(
                () => this.cachedFiles[path].process(content),
                LangProcessingError.with(path),
                "Saplang"
            );
        }

        this.files[path] = this.cachedFiles[path];
    }

    public removeFile(path: string) {
        delete this.cachedFiles[path];
    }

    private checkDuplicateTerms() {
        let checkedTerms: string[] = [];
        let warnedTerms: string[] = [];

        for (const term of this.Terms) {
            for (const key of term.keys) {
                if (checkedTerms.includes(key) && !warnedTerms.includes(key)) {
                    ErrorHandler.warn(`Duplicate term definition '${key}'`, "Saplang");
                    warnedTerms.push(key);
                }
                checkedTerms = checkedTerms.concat(key);
            }
        }
    }

    private checkDuplicateKeys(content: string) {
        const checkedKeys: string[] = [];
        const warnedKeys: string[] = [];

        const lines = content.split("\n");
        for (const line of lines) {
            if (line.startsWith("#") || !line) continue;

            const key = line.split("=")[0].trim();

            if (checkedKeys.includes(key) && !warnedKeys.includes(key)) {
                ErrorHandler.warn(`Duplicate key definition '${key}'`, "Saplang");
                warnedKeys.push(key);
            }
            checkedKeys.push(key);
        }
    }

    public toLang() {
        const blocks: string[] = [];

        this.checkDuplicateTerms();

        // Sort blocks into alphabetical order
        const files = Object.values(this.cachedFiles);
        files.sort((a, b) => a.Name.localeCompare(b.Name));

        for (const file of files) {
            const block = file.toLang(this.Terms);
            if (block) blocks.push(block);
        }

        const joinedBlocks = blocks.join("\n\n");

        this.checkDuplicateKeys(joinedBlocks);

        return joinedBlocks;
    }

    public hasFiles() {
        return this.Paths.length > 0;
    }

    public get Paths() {
        return Object.keys(this.cachedFiles);
    }

    public get Terms() {
        const terms: Term[] = [];
        for (const file in this.cachedFiles) terms.push(...this.cachedFiles[file].Terms);
        return terms;
    }

    public reset(isBuild = false) {
        this.files = {};
        if (isBuild) this.cachedFiles = {};
    }
}
