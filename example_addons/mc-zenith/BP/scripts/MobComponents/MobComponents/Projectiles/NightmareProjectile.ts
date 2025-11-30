import { Entity } from "@minecraft/server";
import Projectile, { OnProjectileImpactData } from "./Projectile";

export default class MonstrousNightmareProjectile extends Projectile {
    static readonly EntityTypes = ["gm1_zen:monstrousnightmare_projectile"];

    LifetimeDuration = 2 * 20;
    Speed = 0.8;
    Gravity = 0;
    Inertia = 1.1;
    OnImpact: OnProjectileImpactData = {
        phaseThroughEntities: true,
        setFireDuration: 40,
    };

    constructor(entity: Entity) {
        super(entity);
        this.init();
    }
}
