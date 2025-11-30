import { Entity } from "@minecraft/server";
import Projectile, { OnProjectileImpactData } from "./Projectile";

export default class GronckleProjectile extends Projectile {
    static readonly EntityTypes = ["gm1_zen:gronckle_projectile"];

    LifetimeDuration = 4 * 20;
    Speed = 0.6;
    Inertia = 1;
    Gravity = 0.05;
    OnImpact: OnProjectileImpactData = {
        blast: {
            damageRange: 4,
            destroyBlocksRange: 0,
            horizontalKnockback: 1.5,
            verticalKnockback: 1.5,
        },
        blockToPlace: "minecraft:flowing_lava",
    };

    constructor(entity: Entity) {
        super(entity);
        this.init();
    }
}
