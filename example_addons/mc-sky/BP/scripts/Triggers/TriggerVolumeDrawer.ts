import { MolangVariableMap, Vector3, system } from "@minecraft/server";
import Main from "Main";
import WorldStore from "Store/World/WorldStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import TriggerManager from "./TriggerManager";

export default class TriggerVolumeDrawer {
    static init() {
        system.runInterval(() => this.drawOutlines(), 20);
    }

    static drawOutlines() {
        if (!WorldStore.get("DrawVolumeTriggers")) return;

        const volumes = [...TriggerManager.getVolumeTriggers()];
        for (let i = 0; i < volumes.length; i++) {
            const volume = volumes[i];

            const color = (i * 4) / volumes.length;
            const molang = new MolangVariableMap();
            molang.setFloat("variable.color", color);

            this.drawVolumeOutline(volume.volume, color);
        }
    }

    static drawVolumeOutline(volume: { min: V3; max: V3 }, color = 0) {
        const { min, max } = volume;
        const playerPos = new V3(
            EntityUtil.getEntities(
                { type: "minecraft:player", closest: 1, location: V3.getCenterOfVolume(volume) },
                Main.overworld
            )[0].location
        );
        const molang = new MolangVariableMap();
        molang.setFloat("variable.color", color);

        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                for (let z = min.z; z <= max.z; z++) {
                    if (x == min.x || x == max.x || y == min.y || y == max.y || z == min.z || z == max.z) {
                        const pos = new V3(x, y + 0.5, z);
                        if (pos.distanceTo(playerPos) > 30) continue;
                        this.drawParticle(pos, molang);
                    }
                }
            }
        }
    }

    private static drawParticle(pos: Vector3, molang?: MolangVariableMap) {
        if (molang) Main.overworld.spawnParticle("gm1:static", pos, molang);
        else Main.overworld.spawnParticle("gm1:static", pos);
    }
}
