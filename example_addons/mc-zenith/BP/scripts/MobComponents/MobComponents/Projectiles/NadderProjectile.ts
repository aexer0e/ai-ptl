import { Entity } from "@minecraft/server";
import Projectile, { OnProjectileImpactData } from "./Projectile";

export default class DeadlyNadderProjectile extends Projectile {
    static readonly EntityTypes = ["gm1_zen:deadlynadder_projectile"];

    LifetimeDuration = 5 * 10;
    Speed = 0.65;
    Inertia = 1.05;
    Gravity = 0.05;
    OnImpact: OnProjectileImpactData = {
        mobEffect: {
            effectId: "poison",
            duration: 5 * 10,
            amplifier: 0,
        },
        stickInGround: {
            lifetimeDuration: 5 * 10,
            lingeringEffect: {
                effectId: "poison",
                duration: 25,
                amplifier: 0,
                interval: 2,
                range: 3,
            },
        },
    };

    constructor(entity: Entity) {
        super(entity);
        this.init();
    }
}
