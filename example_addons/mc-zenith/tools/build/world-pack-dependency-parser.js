import console from "console";
import fs from "fs";

export default class WorldPackDependencyParser{

    #packDependencyPath = "";
    #rawFileContents = "";
    #fileJson = "";

    constructor(packLinkPath){
        this.#packDependencyPath = packLinkPath;
        this.#readFile();
    }

    #readFile(){
        this.#rawFileContents = fs.readFileSync(this.#packDependencyPath, "utf-8");
        this.#fileJson = JSON.parse(this.#rawFileContents);
    }

    setVersionMajorNumber(newMajorNumber) {
        try{
            this.#setVersionNumber(0, newMajorNumber)
        } catch (error) {
            console.log(error);
            throw new Error("Could not set major version number");
        }
    }

    setVersionMinorNumber(newMinorNumber) {
        try{
            this.#setVersionNumber(1, newMinorNumber)
        } catch (error) {
            console.log(error);
            throw new Error("Could not set minor version number");
        }
    }

    setVersionFixNumber(newFixNumber) {
        try{
            this.#setVersionNumber(2, newFixNumber)
        } catch (error) {
            console.log(error);
            throw new Error("Could not set fix version number");
        }
    }


    #setVersionNumber(versionNumberDigit, newNumber) {
        this.#fileJson[0].version[versionNumberDigit] = newNumber;
    }

    writeToFile() {
        const replacer = null;
        const indentationLength = 4;
        var stringToWrite = JSON.stringify(this.#fileJson, replacer, indentationLength);

        fs.writeFileSync(this.#packDependencyPath, stringToWrite);
    }

}

