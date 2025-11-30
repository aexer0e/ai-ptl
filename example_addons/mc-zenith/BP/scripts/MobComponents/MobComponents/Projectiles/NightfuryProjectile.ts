import { Entity } from "@minecraft/server";
import Projectile, { OnProjectileImpactData } from "./Projectile";

export default class NightfuryProjectile extends Projectile {
    static readonly EntityTypes = ["gm1_zen:nightfury_projectile"];

    LifetimeDuration = 2 * 20;
    Speed = 0.8;
    Inertia = 1.1;
    OnImpact: OnProjectileImpactData = {
        blast: {
            damageRange: 2.5,
            destroyBlocksRange: 2.5,
            horizontalKnockback: 1.5,
            verticalKnockback: 1.5,
        },
    };

    constructor(entity: Entity) {
        super(entity);
        this.init();
    }
}
