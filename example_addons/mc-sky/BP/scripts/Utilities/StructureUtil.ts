import { Vector3 } from "@minecraft/server";
import V3 from "Wrappers/V3";
import CommandUtil from "./CommandUtil";

export default class StructureUtil {
    static load(structure: string, position: Vector3, rotation: "0" | "90" | "180" | "270" = "0") {
        const cmd = `structure load ${structure} ${new V3(position).toString()} ${rotation}_degrees none block_by_block 30`;
        CommandUtil.runCommand(cmd);
    }
}
