import { Entity } from "@minecraft/server";
import Projectile, { IgniteTrailData, OnProjectileImpactData } from "./Projectile";

export default class HideousZipplebackProjectile extends Projectile {
    static readonly EntityTypes = ["gm1_zen:hideouszippleback_projectile"];

    LifetimeDuration = 2 * 20;
    Speed = 0.5;
    Gravity = 0.008;
    Inertia = 0.98;

    OnImpact: OnProjectileImpactData = {
        phaseThroughEntities: true,
    };

    IgniteTrail: IgniteTrailData = {
        duration: 3 * 20,
        interval: 4,
        randomOffset: 1,
    };

    constructor(entity: Entity) {
        super(entity);
        this.init();
    }
}
