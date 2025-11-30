import console from "console;";
import fs from "fs";

export default class ManifestParser {
    #manifestPath = "";
    #RawFileContents =  "";
    #fileJson = "";

    constructor(manifestFilePath){
        this.#manifestPath = manifestFilePath;
        console.log(this.#manifestPath)
        this.#readFile();
    }

    #readFile(){
        this.#RawFileContents = fs.readFileSync(this.#manifestPath, "utf-8");
        this.#fileJson = JSON.parse(this.#RawFileContents);
    }

    setVersionMajorNumber(newMajorNumber){
        try {
            this.#setVersionNumber(0, newMajorNumber);
        } catch (error) {
            console.log(error);
            throw new Error("Could not set major version number");
        }
    }

    setVersionMinorNumber(newMinorNumber){
        try {
            this.#setVersionNumber(1, newMinorNumber);
        } catch (error) {
            console.log(error);
            throw new Error("Could not set minor version number");
        }
    }

    setVersionFixNumber(newFixNumber){
        try {
            this.#setVersionNumber(2, newFixNumber);
        } catch (error) {
            console.log(error);
            throw new Error("Could not set minor version number");
        }
    }

    #setVersionNumber(versionNumberDigit, newNumber){
        this.#fileJson.header.version[versionNumberDigit] = newNumber;
    }

    setModuleVersionMajorNumber(moduleTypeToAlter, newMajorNumber) {
        try {
            this.#setModuleVersionNumber(moduleTypeToAlter, 0, newMajorNumber);
        } catch (error) {
            console.log(error);
            throw new Error("Could not set major module version number");
        }
    }

    setModuleVersionMinorNumber(moduleTypeToAlter, newMinorNumber) {
        try {
            this.#setModuleVersionNumber(moduleTypeToAlter, 1, newMinorNumber);
        } catch (error) {
            console.log(error);
            throw new Error("Could not set minor module version number");
        }
    }

    setModuleVersionFixNumber(moduleTypeToAlter, newFixNumber) {
        try {
            this.#setModuleVersionNumber(moduleTypeToAlter, 2, newFixNumber);
        } catch (error) {
            console.log(error);
            throw new Error("Could not set fix module version number");
        }
    }

    #setModuleVersionNumber(moduleTypeToAlter, versionNumberDigit, newNumber){
        let success = false;
        for(const module of this.#fileJson.modules){
            const shouldModuleBeAltered = (module.type === moduleTypeToAlter);
            if(shouldModuleBeAltered) {
                module.version[versionNumberDigit] = newNumber;
                success = true;
            }
        }
        if (success === false){
            throw new Error(`Could not find manifest module of type: ${moduleTypeToAlter}`);
        }
    }

    writeToFile(){
        const replacer = null;
        const indentationLength = 4;
        var stringToWrite = JSON.stringify(this.#fileJson, replacer, indentationLength);
        fs.writeFileSync(this.#manifestPath, stringToWrite);
    }
}
