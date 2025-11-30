import FileUtils from "../../Mangrove/Utilities/FileUtils";
import { JSONObject } from "./Types";

function hasCustomComponent(components: JSONObject) {
    if (!components) return false;
    return Object.keys(components).some((k) => !k.startsWith("minecraft:") && !k.startsWith("tag:"));
}

function entityHasCustomComponent(data: JSONObject) {
    const entity = data["minecraft:entity"] as JSONObject;
    if (!entity) return false;
    if (hasCustomComponent(entity.components as JSONObject)) return true;

    const groups = entity.component_groups as JSONObject[];
    if (!groups) return false;

    return Object.values(groups).some((group) => hasCustomComponent(group as JSONObject));
}

function itemHasCustomComponent(data: JSONObject) {
    const item = data["minecraft:item"] as JSONObject;
    if (!item) return false;
    return hasCustomComponent(item.components as JSONObject);
}

function blockHasCustomComponent(data: JSONObject) {
    const block = data["minecraft:block"] as JSONObject;
    if (!block) return false;
    return hasCustomComponent(block.components as JSONObject);
}

function fileHasCustomComponent(filePath, data: JSONObject) {
    if (!FileUtils.isJSONFile(filePath)) return false;
    if (!FileUtils.isPackFile(filePath)) return false;

    const isBPEntity = filePath.startsWith("BP/entities");
    const isBPItem = filePath.startsWith("BP/items");
    const isBPBlock = filePath.startsWith("BP/blocks");

    if (!isBPEntity && !isBPItem && !isBPBlock) return false;

    if (isBPEntity) return entityHasCustomComponent(data);
    if (isBPItem) return itemHasCustomComponent(data);
    if (isBPBlock) return blockHasCustomComponent(data);
}

export function requireBuild(filePath: string, fileContent: any) {
    if (fileHasCustomComponent(filePath, fileContent)) return `'${filePath}' contains a custom component`;
    return undefined;
}
