import JsonUtils from "../../../Mangrove/Utilities/JsonUtils";
import Constants from "../Constants";
import { MissingKeyError } from "../ErrorTypes";
import { TemplateFile } from "../Types";
import Utils from "../Utils";
import CrimsonTemplate from "./CrimsonTemplate";

export default class CrimsonStandardTemplate extends CrimsonTemplate {
    constructor(data: TemplateFile, path: string) {
        data = JsonUtils.duplicateObject(data);
        super(data, path);

        this.identifier = Utils.pop(data, Constants.KEYWORD.identifier);
        if (!this.identifier) throw new MissingKeyError(Constants.KEYWORD.identifier, "Standard Template");
    }
}
