import { Dimension, Entity, EntityDamageCause, EntityQueryOptions } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import MobComponent from "./MobComponent";

export default class EggroboProjectile extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:badnik_eggrobo_projectile"];

    readonly RaycastInterval = 3;

    shootDir: V3;
    sourceEntity: Entity;
    dimension: Dimension;

    raycastTimer = 0;

    constructor(entity: Entity) {
        super(entity, 1);
        this.dimension = entity.dimension;
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;
        if (!this.shootDir) return;

        const velocity = new V3(this.entity.getVelocity());
        const correctVelocity = this.shootDir.multiply(GameData.RoboProjectileSpeed);
        const velocityOffset = V3.subtract(correctVelocity, velocity);
        this.entity.applyImpulse(velocityOffset);

        this.raycastTimer++;
        if (this.raycastTimer === this.RaycastInterval) this.raycastTimer = 0;
        else return;

        // Entity raycasting
        const entityPos = new V3(this.entity.location);
        const queryPos = new V3(entityPos);
        queryPos.y += GameData.RoboProjectileHitQueryYOffset;
        const query: EntityQueryOptions = {
            location: queryPos,
            maxDistance: GameData.RoboProjectileHitRadius,
        };
        const hitEntities = EntityUtil.getEntities(query, this.dimension);
        for (const target of hitEntities) {
            if (target.typeId === "minecraft:player") {
                EntityUtil.applyDamage(target, 5, { damagingEntity: this.sourceEntity, cause: EntityDamageCause.entityAttack });
                this.entity.triggerEvent("gm1_ord:despawn");
                return;
            }
        }
        // Block raycasting
        const castPos = entityPos.addV3(this.shootDir.multiply(GameData.RoboProjectileBlockDetectRange));
        const castDir = this.shootDir.multiply(-1);
        const hasLineOfSight =
            this.dimension.getEntitiesFromRay(castPos, castDir, { type: "gm1_ord:badnik_eggrobo_projectile" }).length > 0;
        if (!hasLineOfSight) {
            this.entity.triggerEvent("gm1_ord:despawn");
            return;
        }
    }
}
