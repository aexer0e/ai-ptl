import fs from "fs";
import nbt from "prismarine-nbt";

/* global Buffer */

export default class LevelDatEditor {

    /**
     * Creates an instance of the LevelDatEditor.
     * 
     * @constructor
     * @param {string} filePath - The path to the level.dat file.
     */
    constructor(filePath) {
        this.filePath = filePath;
        this.header = null;
        this.data = null;
        this.length = null;
        this.init();
    }

    async init() {
        const rawBuffer = fs.readFileSync(this.filePath);
        this.header = rawBuffer.subarray(0, 4); // Bedrock header is the first 8 bytes, the first 4 bytes are version format the next 4 bytes are the length of the data
        this.data = nbt.parseUncompressed(rawBuffer.subarray(8), 'little');
    }

    #calculateLength(lengthInt) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, lengthInt, true);
        return Buffer.from(buffer);
    }

    #dataToBuffer() {
        return nbt.writeUncompressed(this.data, 'little');
     }

    /**
     * Retrieves the value associated with the given key from the data object.
     * 
     * @param {string} key - The key whose value is to be retrieved.
     * @returns {*} The value associated with the specified key.
     * @throws {Error} If the data is not loaded.
     */
    getValue(key) {
        if (!this.data) {
            throw new Error("Data not loaded. Call init() first.");
        }
        return this.data.value[key];
    }

    /**
     * Retrieves all values from the loaded data.
     * 
     * @returns {any} The value of the loaded data.
     * @throws {Error} If the data is not loaded.
     */
    getAllValues() {
        if (!this.data) {
            throw new Error("Data not loaded. Call init() first.");
        }
        return this.data.value;
    }

    /**
     * Sets the value for a given key in the data object.
     *
     * @param {string} key - The key for which the value needs to be set.
     * @param {*} value - The value to set for the specified key.
     * @throws {Error} If the data is not loaded.
     */
    setValue(key, value) {
        if (!this.data) {
            throw new Error("Data not loaded. Call init() first.");
        }
        this.data.value[key].value = value;
    }

    /**
     * Writes the current data to a file.
     * 
     * This method converts the data to a buffer, calculates the length of the buffer,
     * and then writes the combined header, length, and content buffers to the specified file path.
     * 
     * @async
     * @returns {Promise<void>} A promise that resolves when the file has been written.
     */
    async writeToFile() {
        const contentBuffer = this.#dataToBuffer();
        const lengthBuffer = this.#calculateLength(contentBuffer.length);
        const finalBuffer = Buffer.concat([this.header, lengthBuffer, contentBuffer]);
        fs.writeFileSync(this.filePath, finalBuffer);
    }
}