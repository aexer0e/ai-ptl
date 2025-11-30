import { BlockHitInformation, Direction, Entity, EntityApplyDamageByProjectileOptions, world } from "@minecraft/server";
import { VanillaMobEffect } from "Types/VanillaMobEffect";
import V3 from "Wrappers/V3";
import MobComponent, { EntityReference, PlayerReference } from "../MobComponent";

export interface MobEffectData {
    /** The effect ID, such as "slowness", "poison", etc. */
    effectId: VanillaMobEffect;

    /** Duration of the effect in ticks. */
    duration: number;

    /** Amplifier level of the effect. */
    amplifier: number;
}

export interface LingeringMobEffectData extends MobEffectData {
    /** How often to apply the effect in ticks. */
    interval: number;
    /** The distance range from the projectile to affect other targets */
    range: number;
}

export interface IgniteTrailData {
    /** How long to wait before igniting the trail */
    duration: number;
    /** The interval to summon a ignite gas at */
    interval: number;
    /** Random offset to apply to the spawn location of the ignite gas */
    randomOffset: number;
}

export interface ProjectileBlastData {
    /** Horizontal knockback caused by the blast. */
    horizontalKnockback: number;

    /** Vertical knockback caused by the blast. */
    verticalKnockback: number;

    /** Blast damage range. */
    damageRange: number;

    /** Range in which blocks are destroyed. */
    destroyBlocksRange: number;
}

export interface OnProjectileImpactData {
    /** Block to place on impact. */
    blockToPlace?: string;

    /** The duration of time to set the target on fire. Default is 0 */
    setFireDuration?: number;

    /** Mob effect to apply on impact. */
    mobEffect?: MobEffectData;

    /** Blast effect on impact. If unset, projectile doesn't blast. */
    blast?: ProjectileBlastData;

    /** Whether to phase through entities when hitting them instead of being destroyed. Default is false */
    phaseThroughEntities?: boolean;

    /** Sticking behavior on impact. If unset, projectile doesn't stick. */
    stickInGround?: {
        /** How long the stuck projectile persists. */
        lifetimeDuration: number;

        /** Lingering effect around the stuck projectile. */
        lingeringEffect?: LingeringMobEffectData;
    };
}

export default abstract class Projectile extends MobComponent {
    /** The projectile's lifetime before it despawns. */
    abstract LifetimeDuration: number;

    /** The projectile's speed. */
    abstract Speed: number;

    /** Intensity of gravity on the projectiles. Default is 0. */
    Gravity?: number;

    /**
     * How much of its speed to maintain every tick.
     * >1 means it speeds up, <1 means it slows down. Default is 1.
     */
    Inertia?: number;

    /** Behavior upon impact. */
    OnImpact?: OnProjectileImpactData;

    /** Whether the projectile should leave a trail that ignites (For Hideous Zippleback). */
    IgniteTrail?: IgniteTrailData;

    velocity: V3 = new V3(0, 0, 0);
    aliveTime = 0;
    damage = 0;
    isInGround = false;
    isInGroundTime = 0;
    hasHit = false;
    ownerDragon?: EntityReference;
    ownerPlayer?: PlayerReference;

    constructor(entity: Entity) {
        super(entity, 1);
    }

    init() {
        const owner = EntityStore.getOwner(this.entityF);
        if (owner) {
            this.ownerDragon = owner;
            const dragonComponent = owner.getDragonMobComponent();
            const damageOverride = dragonComponent?.milestone.projectileDamage;
            this.ownerPlayer = dragonComponent?.flightSystem.getRider();
            if (damageOverride) {
                this.damage = damageOverride;
            } else {
                console.warn("No damage override found for projectile: " + this.entityF.typeId);
            }
        }

        this.velocity = new V3(this.getPersistentProperty("InitialDirection")).normalize().multiply(this.Speed);

        this.onWorldEvent("WorldAfterEvents", "projectileHitBlock", (eventData) => {
            if (eventData.projectile.id !== this.entity.id) return;
            if (!this.entity.valid()) return;

            this.onHitBlock(eventData.getBlockHit());
        });

        this.onWorldEvent("WorldAfterEvents", "projectileHitEntity", (eventData) => {
            if (eventData.projectile.id !== this.entity.id) return;
            if (!this.entity.valid()) return;

            const hitEntity = eventData.getEntityHit().entity;
            if (hitEntity) this.onHitEntity(hitEntity);
        });
    }

    process() {
        if (!this.entity.valid()) return;
        DebugTimer.countStart("ProjectileTick");

        if (this.isInGround) {
            const stickInGroundData = this.OnImpact?.stickInGround;
            if (stickInGroundData && this.isInGroundTime >= stickInGroundData.lifetimeDuration) {
                this.entityF.remove();
                return DebugTimer.countEnd();
            }
            this.isInGroundTime += 1;

            if (stickInGroundData?.lingeringEffect) {
                if (this.isCurrentTickNth(stickInGroundData.lingeringEffect.interval)) {
                    const targets = this.getTargetsInRange(stickInGroundData.lingeringEffect.range);
                    for (const target of targets) {
                        this.applyMobEffect(target, stickInGroundData.lingeringEffect);
                    }
                }
            }

            return DebugTimer.countEnd();
        }

        this.aliveTime += 1;
        if (this.aliveTime >= this.LifetimeDuration) {
            this.entityF.remove();
            return DebugTimer.countEnd();
        }

        if (this.IgniteTrail) {
            if (this.isCurrentTickNth(this.IgniteTrail.interval)) {
                try {
                    const spawnLocation = new V3(this.entityF.location).addV3(
                        V3.random(-this.IgniteTrail.randomOffset, this.IgniteTrail.randomOffset)
                    );
                    const igniteGas = EntityUtil.spawnEntity("gm1_zen:ignite_gas", spawnLocation, this.entityF.dimension);
                    if (this.ownerPlayer?.id) EntityStore.temporary.set(igniteGas, "OwnerPlayerId", this.ownerPlayer.id);
                    if (this.ownerDragon?.id) EntityStore.temporary.set(igniteGas, "OwnerDragonId", this.ownerDragon.id);
                } catch {}
            }
        }

        this.entity.clearVelocity();

        this.velocity = this.applyGravity(this.velocity);
        this.velocity = this.applyInertia(this.velocity);

        this.entity.applyImpulse(this.velocity);

        DebugTimer.countEnd();
    }

    onHitEntity(entity: Entity) {
        if (!this.OnImpact) {
            this.entityF.remove();
            return;
        }

        // console.warn("Hit entity: " + entity.typeId);

        if (this.OnImpact.blast) {
            this.applyBlast();
        } else {
            if (this.OnImpact.mobEffect) {
                this.applyMobEffect(entity, this.OnImpact.mobEffect);
            }
            if (this.OnImpact.setFireDuration) {
                this.setOnFire(entity, this.OnImpact.setFireDuration);
            }
            this.applyDamage(entity, this.damage);
            this.applyKnockback(entity, this.velocity.x, this.velocity.z, 0.5, 0.5);
        }

        if (this.OnImpact.blockToPlace) {
            this.timeout(() => {
                this.applyBlockPlace();
            });
        }

        this.entityF.setProperty("gm1_zen:has_hit", true);

        if (!this.OnImpact.phaseThroughEntities) {
            this.timeout(() => this.entityF.remove(), 2);
        }
    }

    onHitBlock(blockHitInformation: BlockHitInformation) {
        if (!this.OnImpact) {
            this.entityF.remove();
            return;
        }

        if (this.isInGround) return;
        this.isInGround = true;

        // console.warn("Hit block: " + blockHitInformation.block.typeId);

        if (this.OnImpact.blast) {
            this.applyBlast();
        }

        if (this.OnImpact.blockToPlace) {
            const placeLocation = new V3(blockHitInformation.block.location).addV3(
                V3.fromDirection(blockHitInformation.face).multiply(1.5)
            );
            // console.warn("Placing block at: " + placeLocation.toString());
            this.timeout(() => {
                this.applyBlockPlace(placeLocation);
            });
        }

        this.entityF.setProperty("gm1_zen:has_hit", true);

        if (!this.OnImpact.stickInGround) {
            this.timeout(() => this.entityF.remove(), 2);
        }
    }

    applyBlast() {
        const blastData = this.OnImpact!.blast!;

        if (blastData.destroyBlocksRange) {
            try {
                this.entityF.dimension.createExplosion(this.entityF.location, blastData.destroyBlocksRange, {
                    breaksBlocks: true,
                    allowUnderwater: true,
                    causesFire: false,
                    source: this.entityF,
                });
            } catch {}
        }

        const targets = this.getTargetsInRange(blastData.damageRange);
        for (const target of targets) {
            if (target.id === this.entity.id) continue;

            const knockbackDirection = new V3(this.entityF.location).subtractV3(target.location).normalize();
            try {
                this.applyKnockback(
                    target,
                    knockbackDirection.x,
                    knockbackDirection.z,
                    blastData.verticalKnockback,
                    blastData.horizontalKnockback
                );

                this.applyDamage(target, this.damage);

                if (this.OnImpact!.mobEffect) {
                    this.applyMobEffect(target, this.OnImpact!.mobEffect);
                }

                if (this.OnImpact!.setFireDuration) {
                    this.setOnFire(target, this.OnImpact!.setFireDuration);
                }
            } catch (e) {}
        }
    }

    getTargetsInRange(range: number) {
        const targets = EntityUtil.getEntitiesAtDimLoc({ maxDistance: range }, this.entityF);
        return targets.filter((target) => target.id !== this.entity.id);
    }

    applyBlockPlace(location?: V3) {
        const blockToPlace = this.OnImpact!.blockToPlace!;
        if (!location) {
            location = new V3(this.entityF.location);
            location = location.addV3(this.velocity.normalize().multiply(-0.3));
        }

        const raycastDownward = this.entityF.dimension.getBlockFromRay(location, V3.fromDirection(Direction.Down), {
            maxDistance: 5,
        });
        if (raycastDownward) {
            if (GameData.CanPlaceOverBlocks.has(raycastDownward.block.typeId)) {
                location = new V3(raycastDownward.block.location);
            } else {
                location = new V3(raycastDownward.block.location).addY(1);
            }
        } else {
            location = location.addY(-4);
        }

        const block = this.entityF.dimension.getBlock(location);
        if (!block || !block.isValid) return;

        if (GameData.CanPlaceOverBlocks.has(block?.typeId)) {
            try {
                block.setType(blockToPlace);
            } catch {}
        }
    }

    applyDamage(entity: Entity, damage: number) {
        if (!this.shouldDamageTarget(entity)) return;
        if (!world.gameRules.pvp && EntityUtil.isAffectedByPvp(entity)) return;
        try {
            const damageOptions: EntityApplyDamageByProjectileOptions = {
                damagingProjectile: this.entityF,
            };

            if (this.ownerPlayer?.valid()) {
                damageOptions.damagingEntity = this.ownerPlayer;
            }

            entity.applyDamage(damage, damageOptions);
        } catch {}
    }

    setOnFire(entity: Entity, duration: number) {
        if (!this.shouldDamageTarget(entity)) return;
        if (!world.gameRules.pvp && EntityUtil.isAffectedByPvp(entity)) return;
        if (EntityUtil.hasFamilies(entity, ["dragon"])) return;
        try {
            entity.setOnFire(duration);
        } catch {}
    }

    applyMobEffect(entity: Entity, mobEffect: MobEffectData) {
        if (!this.shouldDamageTarget(entity)) return;
        if (!world.gameRules.pvp && EntityUtil.isAffectedByPvp(entity)) return;
        try {
            entity.addEffect(mobEffect.effectId, mobEffect.duration, {
                amplifier: mobEffect.amplifier,
                showParticles: true,
            });
        } catch {}
    }

    applyKnockback(entity: Entity, x: number, z: number, verticalKnockback: number, horizontalKnockback: number) {
        if (!this.shouldDamageTarget(entity)) return;
        if (!world.gameRules.pvp && EntityUtil.isAffectedByPvp(entity)) return;
        try {
            entity.applyKnockback(x, z, verticalKnockback, horizontalKnockback);
        } catch {}
    }

    shouldDamageTarget(entity: Entity) {
        const entityTypeId = entity.typeId;
        if (entityTypeId == "minecraft:item") return false;
        if (entityTypeId.includes("projectile")) return false;

        const entityId = entity.id;
        if (entityId == this.entityId || entityId == this.ownerDragon?.id || entityId == this.ownerPlayer?.id) return false;
        return true;
    }

    applyGravity(vector: V3) {
        if (!this.Gravity) return vector;
        return vector.addY(-this.Gravity);
    }

    applyInertia(vector: V3) {
        if (!this.Inertia) return vector;
        return vector.multiply(this.Inertia);
    }
}
