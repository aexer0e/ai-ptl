import { TicksPerSecond } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import Trigger from "./Trigger";

export default class extends Trigger {
    init() {
        this.onWorldEvent("WorldAfter", "entitySpawn", (eventData) => {
            if (eventData.entity.typeId === "gm1_sky:ai_player") {
                const chosenSpawnAnimation = MathUtil.choose(GameData.SpawnAnimations);
                eventData.entity.setProperty("gm1_sky:spawn_sequence", chosenSpawnAnimation.propertyNumber);
                eventData.entity.addEffect("slowness", 3 * TicksPerSecond, { amplifier: 255, showParticles: false });
                this.timeout(() => {
                    if (!EntityUtil.isValid(eventData.entity)) return;
                    eventData.entity.setProperty("gm1_sky:spawn_sequence", 0);
                    eventData.entity.removeEffect("slowness");
                }, 3 * TicksPerSecond);
            }
        });
    }
}
