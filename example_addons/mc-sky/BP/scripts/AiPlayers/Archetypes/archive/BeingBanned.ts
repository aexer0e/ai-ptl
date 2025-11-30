import { Entity } from "@minecraft/server";
import Archetype, { GoalEntry } from "../Archetype";

export default class extends Archetype {
    goals: GoalEntry = {};
    static priority(entity: Entity) {
        const prop = entity.getProperty("gm1_sky:ban_level") as number;
        if (prop > 0) {
            return -12;
        }
        return 12;
    }

    onEnter(): void {
        this.entity.addTag("lockedMovement");
        const rotation = this.entity.getRotation();
        rotation.y = Math.round(rotation.y / 90) * 90;
        this.entity.setRotation(rotation);
        this.entity.addEffect("slowness", 250, { amplifier: 255, showParticles: false });
    }

    onExit(): void {
        this.entity.removeTag("lockedMovement");
        this.entity.removeEffect("slowness");
    }
}
