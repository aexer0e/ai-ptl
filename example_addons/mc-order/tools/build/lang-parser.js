import fs from "fs";

export default class LangParser {

    #langPath = "";
    #fileContents = "";

    constructor(langPath) {
        this.#langPath = langPath
        this.#readfile();
    }

    #readfile() {
        const rawFileContents = fs.readFileSync(this.#langPath, "utf-8");
        this.#fileContents = rawFileContents.split(/\r?\n/);
    }

    getValueByKey(keyToFind) {
        for (const line of this.#fileContents) {
            if (!this.isLineValidlyFormatted(line)) {
                continue;
            }

            const separator = '=';
            const limit = 2;
            let [lineKey, lineValue] = line.split(separator, limit);

            if (lineKey === keyToFind) {
                return lineValue;
            }
        }
        throw new Error(`Key ${keyToFind} not found.`);
    }

    setValueByKey(keyToFind, newValue){
        for (const [i, line] of this.#fileContents.entries()) {
            if (!this.isLineValidlyFormatted(line)) {
                continue;
            }

            const separator = '=';
            const limit = 1;
            let [ lineKey ] = line.split(separator, limit);
            if (lineKey !== keyToFind) {
                continue;
            }

            var newLine = `${lineKey}=${newValue}`;
            this.#fileContents[i] = newLine;
            return;
        }
        throw new Error(`Key ${keyToFind} not found.`);
    }


    isLineValidlyFormatted(lineToCheck) {
        var isLineValidlyFormatted = lineToCheck.includes("=");
        return isLineValidlyFormatted;
    }

    writeToFile() {
        var stringToWrite = "";
        for (const line of this.#fileContents) {
            stringToWrite = stringToWrite.concat(line, "\n");
        }

        fs.writeFileSync(this.#langPath, stringToWrite);
    }
}
