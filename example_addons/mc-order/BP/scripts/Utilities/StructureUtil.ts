import { Vector3 } from "@minecraft/server";
import V3 from "Wrappers/V3";
import CommandUtil from "./CommandUtil";

export default class structureUtil {
    //TODO Replace with native structure API

    /**
     * Loads a structure at a specified position with a given rotation.
     *
     * @param structure - The name of the structure to load.
     * @param position - The position where the structure will be loaded.
     * @param rotation - The rotation angle for the structure. Can be "0", "90", "180", or "270". Defaults to "0".
     */
    static load(structure: string, position: Vector3, rotation: "0" | "90" | "180" | "270" = "0") {
        const cmd = `structure load ${structure} ${new V3(position).toString()} ${rotation}_degrees`;
        CommandUtil.runCommand(cmd);
    }
}
