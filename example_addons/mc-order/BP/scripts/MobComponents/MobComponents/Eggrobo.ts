import { Dimension, Entity, EntityComponentTypes, EntityHealthComponent } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import EggroboProjectile from "./EggroboProjectile";
import MobComponent from "./MobComponent";

export default class Eggrobo extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:badnik_eggrobo"];

    shootTimer = 0;

    dimension: Dimension;

    constructor(entity: Entity) {
        super(entity, 1);

        this.dimension = entity.dimension;

        entity.addEffect("slow_falling", 10000000, { showParticles: false });

        this.shootTimer = MathUtil.randomInt(0, GameData.RoboShootInterval);

        this.onWorldEvent("WorldAfterEvents", "entityHurt", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.hurtEntity.id !== this.entityId) return;

            const healthComp = this.entity!.getComponent(EntityComponentTypes.Health) as EntityHealthComponent;
            const newHealth = healthComp!.currentValue;
            if (newHealth > 0) return;
            const currentPos = this.entity.location;
            this.dimension.spawnEntity("gm1_ord:ring", {
                x: Math.round(currentPos.x) - 0.5,
                y: Math.round(currentPos.y) - 0.5,
                z: Math.round(currentPos.z) - 0.5,
            });
        });
    }

    lastTimeDroppedHazards = 0;
    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        this.shootTimer++;
        if (this.shootTimer === GameData.RoboShootInterval) {
            this.shootTimer = 0;
            const roboPos = new V3(this.entity.location);

            let projectileSpawnPos = roboPos.addY(GameData.RoboShootOffset.y);
            const viewDir = new V3(this.entity.getViewDirection());
            projectileSpawnPos = projectileSpawnPos.addV3(viewDir.rotateAroundY(Math.PI / 2).multiply(GameData.RoboShootOffset.x));
            projectileSpawnPos = projectileSpawnPos.addV3(viewDir.multiply(GameData.RoboShootOffset.z));

            const target = EntityUtil.getNearestPlayer(roboPos, this.dimension, GameData.RoboShootRange);
            if (!target) return;
            const targetPos = new V3(target.location);
            targetPos.y += GameData.RoboAimYOffset;
            const shootDir = V3.subtract(targetPos, projectileSpawnPos).normalize();
            const projectile = EntityUtil.spawnEntityRotated(
                "gm1_ord:badnik_eggrobo_projectile",
                projectileSpawnPos,
                shootDir.asRotation(),
                this.dimension
            );
            this.entity.setProperty("gm1_ord:is_shooting", true);
            this.timeout(() => {
                const projectileComp = MobComponentManager.getInstanceOfComponent(EggroboProjectile, projectile) as EggroboProjectile;
                projectileComp.shootDir = shootDir;
                projectileComp.sourceEntity = this.entity!;
                this.entity!.setProperty("gm1_ord:is_shooting", false);
            }, 1);
        }
    }
}
