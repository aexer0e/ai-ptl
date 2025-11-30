import { BlockComponentStepOnEvent, BlockCustomComponent } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import AbstractBlockComponent from "../AbstractBlockComponent";

interface SpikeConfig {
    damage: number;
    knockback: { x: number; y: number; z: number; strength: number };
}

const spikeConfigs: { [key: string]: SpikeConfig } = {
    "gm1_ord:lf_spikes": {
        damage: 4,
        knockback: { x: 0, y: 0.4, z: 0, strength: 0.6 },
    },
    "gm1_ord:lf_spike": {
        damage: 8,
        knockback: { x: 0, y: 0.6, z: 0, strength: 0.8 },
    },
};

export default class Spikes extends AbstractBlockComponent {
    public static get identifier() {
        return "gm1_ord:lf_spikes";
    }

    public static get events(): BlockCustomComponent {
        return {
            onStepOn: this.onStepOn.bind(this),
        };
    }

    private static onStepOn(event: BlockComponentStepOnEvent) {
        const entity = event.entity;
        if (!EntityUtil.isValid(entity)) return;
        if (entity.typeId === "minecraft:item") return;

        const config = spikeConfigs[event.block.typeId];

        EntityUtil.applyDamage(entity, config.damage);
        entity.applyKnockback(config.knockback.x, config.knockback.y, config.knockback.z, config.knockback.strength);
    }
}
