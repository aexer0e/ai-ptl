import ErrorHandler from "../../Mangrove/Errors/ErrorHandler";
import Constants from "./Constants";
import { InvalidLineError } from "./ErrorTypes";
import { Entry, Line, Term } from "./Types";

export default class SaplangFile {
    private path: string;
    private terms: Term[] = [];
    private localTerms: Term[] = [];
    private lines: Line[] = [];
    private shouldTranslate: boolean = true;

    private remarksCache: string[] = [];

    constructor(path: string) {
        this.path = path;

        const fileName = path.split("/").pop()!;
        if (fileName.startsWith(Constants.NO_TRANSLATE_PREFIX)) this.shouldTranslate = false;
    }

    public process(content: string) {
        if (Array.isArray(content)) content = content.join("\n");
        const lines = content.split(/\r?\n/);

        for (const line of lines) {
            if (line.startsWith("#") || !line) continue;
            else if (Constants.HEADING_REGEX.test(line)) this.processHeading(line);
            else if (Constants.REMARK_REGEX.test(line)) this.processRemarks(line);
            else if (Constants.ENTRY_REGEX.test(line)) this.processEntry(line);
            else if (Constants.TERM_REGEX.test(line)) this.processTerm(line);
            else throw new InvalidLineError(`${line}`);
        }
    }

    private processHeading(line: string) {
        let [_, depth, text] = Constants.HEADING_REGEX.exec(line)!;
        text = text.trim();

        this.lines.push({
            depth: depth.length,
            text,
        });
    }

    private processTerm(line: string) {
        let [_, rawKeys, text] = Constants.TERM_REGEX.exec(line)!;
        text = text.trim();

        let isLocal = rawKeys.startsWith(Constants.LOCAL_TERM_PREFIX);
        if (isLocal) rawKeys = rawKeys.substring(Constants.LOCAL_TERM_PREFIX.length);

        const splitKeys = rawKeys.split(Constants.ALIAS_SEPARATOR);
        const keys = splitKeys.map((key) => key.trim().toLowerCase());

        const term = {
            keys,
            text,
        };

        if (isLocal) this.localTerms.push(term);
        else this.terms.push(term);
    }

    private processEntry(line: string) {
        let [_, key, text] = Constants.ENTRY_REGEX.exec(line)!;

        if (text.includes("##")) ErrorHandler.warn(`Move inline comment on '${key}' to a remark`, "Saplang");

        let translate = this.shouldTranslate;
        const prefix = Constants.NO_TRANSLATE_PREFIX;
        // If entry is marked as not to be translated
        if (key.startsWith(prefix)) {
            translate = false;
            key = key.substring(Constants.NO_TRANSLATE_PREFIX.length);
        }
        // If entire file is marked as not to be translated
        if (this.path.startsWith(prefix)) translate = false;

        const remarks = this.remarksCache;
        this.lines.push({
            key,
            text,
            remarks,
            translate,
        });

        this.remarksCache = [];
    }

    private processRemarks(line: string) {
        let [_, remark] = Constants.REMARK_REGEX.exec(line)!;
        remark = remark.trim();

        this.remarksCache.push(remark);
    }

    public toLang(terms: Term[]) {
        let containsEntry: boolean = false;
        const lines: string[] = [`${Constants.COMMENT_PREFIX} ${this.path}`];

        terms = this.localTerms.concat(terms);

        for (const line of this.lines) {
            if ("remarks" in line) {
                let comments = Constants.NO_TRANSLATE_TEXT;
                if (line.translate) comments = this.generateComment(line, terms);

                lines.push(`${line.key}=${line.text}\t${Constants.COMMENT_PREFIX}${comments}`);
                containsEntry = true;
            } else {
                lines.push(`\n${Constants.COMMENT_PREFIX}${"#".repeat(line.depth)} ${line.text}`);
            }
        }

        // If the file doesn't contain any entries, return an empty string
        if (!containsEntry) return;

        return lines.join("\n");
    }

    private generateComment(entry: Entry, terms: Term[]) {
        let comments: string[] = [];
        const usedTerms: { [key: string]: boolean } = {};

        const stringsToSearch: string[] = [entry.key, entry.text, ...entry.remarks];
        while (stringsToSearch.length > 0) {
            const currentString = stringsToSearch.shift()!.toLowerCase();

            for (const term of terms) {
                const keys = term.keys;
                const text = term.text;
                const primary = keys[0];

                if (usedTerms[primary]) continue;

                for (let key of keys) {
                    const affixRegex = `[${Constants.PUNCTUATION_REGEX}]|^|$|(${Constants.FORMATTING_REGEX})`;
                    let keyRegex = new RegExp(`(${affixRegex})${key}(${affixRegex})`);

                    // If we are matching a formatting codes, we don't care about what's around it
                    const formattingRegex = new RegExp(Constants.FORMATTING_REGEX);
                    if (formattingRegex.test(key)) keyRegex = new RegExp(key);

                    // If key is inside quotes, we don't care about what's around it
                    const quotesRegex = new RegExp(Constants.QUOTES_REGEX);
                    if (quotesRegex.test(key)) {
                        key = key = key.slice(1, -1);
                        keyRegex = new RegExp(key);
                    }

                    // Test if the key fits the keyRegex
                    if (keyRegex.test(currentString)) {
                        const comment = `"${key}" is ${text}`;
                        comments.push(comment);
                        stringsToSearch.push(text);

                        usedTerms[primary] = true;
                        break;
                    }
                }
            }
        }

        // Reverse comments
        comments = comments.reverse();
        // Add remarks to the end
        comments = comments.concat(entry.remarks);

        return comments.join("; ");
    }

    public get Terms() {
        return this.terms;
    }

    public get Name() {
        return this.path;
    }
}
