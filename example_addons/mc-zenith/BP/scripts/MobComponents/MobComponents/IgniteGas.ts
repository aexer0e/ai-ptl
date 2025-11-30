import { Entity, world } from "@minecraft/server";
import MobComponent from "./MobComponent";

export default class IgniteGas extends MobComponent {
    static readonly EntityTypes = ["gm1_zen:ignite_gas"];

    // Amount of explosions = lifetimeDuration/interval in the dragon projectile file

    DurationToIgnite = 2 * 20;
    DurationToDespawn = 2.5 * 20;
    Damage = 1; // Damage of the ignite explosions
    Range = 4.5; // Distance to targets from center of the gas entity
    ExplosionPower = 2; //power of block breaking for the explosions

    age = 0;

    constructor(entity: Entity) {
        super(entity, 1);
    }

    process() {
        if (!this.entity.valid()) return;

        if (this.age == this.DurationToIgnite) {
            this.entity.setProperty("gm1_zen:is_ignited", true);
            const targets = this.getTargetsInRange(this.Range);
            for (const target of targets) {
                target.applyDamage(this.Damage);
            }

            try {
                this.entity.dimension.createExplosion(this.entity.location, this.ExplosionPower, {
                    breaksBlocks: true,
                    allowUnderwater: false,
                    causesFire: false,
                    source: this.entity,
                });
            } catch {}
        }

        if (this.age >= this.DurationToDespawn) {
            this.entity.remove();
            return;
        }

        this.age++;
        this.entity.teleport(this.entity.location);
    }

    getTargetsInRange(range: number) {
        let targets = EntityUtil.getEntitiesAtDimLoc({ maxDistance: range }, this.entityF);

        if (!world.gameRules.pvp) {
            targets = targets.filter((target) => !EntityUtil.isAffectedByPvp(target));
        }

        const playerOwnerId = this.getTemporaryProperty("OwnerPlayerId");
        if (playerOwnerId) {
            targets = targets.filter((target) => target.id !== playerOwnerId);
        }

        const dragonOwnerId = this.getTemporaryProperty("OwnerDragonId");
        if (dragonOwnerId) {
            targets = targets.filter((target) => target.id !== dragonOwnerId);
        }

        return targets.filter((target) => target.id !== this.entity.id);
    }
}
