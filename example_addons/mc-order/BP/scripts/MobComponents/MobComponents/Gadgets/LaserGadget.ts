import { Block, Entity, EntityDamageCause, system } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Gadget from "./Gadget";

export default class LaserGadget extends Gadget {
    readonly gadgetId = 1;

    readonly LaserTelegraphTime = 2 * 20; // The number of ticks the laser attack is telegraphed before executing
    readonly LaserMaxAimTime = 10 * 20; //How long the laser can aim at the player before shooting
    readonly LaserCooldownExit = 10; // The number of ticks the laser attack waits after shooting before exiting the action (mainly for art)

    readonly LaserVerticalOffset: number = -1.25;
    readonly LaserHorizontalOffset: number = 0.00125;
    readonly laserLerpRate = 0.005;
    readonly initalLaserLerpSpeed = 0.1;
    LaserLerpSpeed = 0.2; //How fast the laser tracks the target

    readonly ValidDistanceLaserEndToTarget = 0.35; //How close the laser has to be to the target to be considered tracking target (use care if adjusting this, values greater than 0.5 might cause odd results)
    readonly TicksUntilLockedOn = 10; //How long the laser has to be on target to be considered locked on
    readonly TrackingTicksAfterLostSight = 8; //How long the laser tracks the target after losing sight
    readonly LostSightOfPlayerShootDelay = 1 * 20; //How long the laser waits after losing sight of the player before shooting

    readonly ExplosionSize = 3; //Size of explosion on laser impact
    readonly ExplosionDestroyBlocks = true; //Whether the explosion destroys blocks

    lastTargetLocation: V3 | undefined = undefined;

    laserAimTime = 0;
    laserChargeTime = 0;
    laserCooldownTime = 0;

    laserOnTargetTime = 0;
    laserLockedOn = false;

    lostSightOfPlayerTime = 0;

    targetLocation: V3 | undefined = undefined;
    directionToTarget: V3 | undefined = undefined;

    laserRunnerID: number = 0;

    resetRotation: boolean = true;

    init() {
        this.entity.setProperty("gm1_ord:laser_length", 0);
        this.entity.setProperty("gm1_ord:is_shooting_laser", false);
    }

    laserTelegraph() {
        this.entity.setProperty("gm1_ord:is_charging_gadget", true);
        this.timeout(() => {
            this.entity.setProperty("gm1_ord:is_charging_gadget", false);
            this.entity.setProperty("gm1_ord:is_using_gadget", true);
            this.LaserLerpSpeed = this.initalLaserLerpSpeed;
            this.laserProcess();
        }, this.LaserTelegraphTime);
    }

    laserProcess() {
        if (this.resetRotation == true) {
            this.entity.setProperty("gm1_ord:laser_rot_x", this.entity.getRotation().x);
            this.entity.setProperty("gm1_ord:laser_rot_y", this.entity.getRotation().y);
            this.resetRotation = false;
        }
        const nearestPlayer = EntityUtil.getNearestPlayer(
            this.entity.location,
            this.entity.dimension,
            this.eggmanComponent.PlayerDetectionRange
        );

        if (!nearestPlayer) return;

        this.laserRunnerID = system.runInterval(() => {
            this.laserAimTime++;

            const eggmanLocation = new V3(this.entity.location);
            const eggmanDirection = new V3(this.entity.getViewDirection().x, 0, this.entity.getViewDirection().z).normalize();

            let laserStartLocation = eggmanLocation.addV3(
                eggmanDirection.multiplyV3(new V3(this.LaserHorizontalOffset, 0, this.LaserHorizontalOffset))
            );
            laserStartLocation = laserStartLocation.addY(this.LaserVerticalOffset);
            const playerLocation = new V3(nearestPlayer.location).addY(0);

            const directionToPlayerOriginal = laserStartLocation.subtractV3(playerLocation).normalize();
            const directionToPlayer = directionToPlayerOriginal.clampY(-0.8, 0.8).normalizeXZOnly(); // if player is right above laser don't attack
            let validRaycast: Entity | Block | undefined = undefined;
            validRaycast = this.entity.dimension.getEntitiesFromRay(laserStartLocation, directionToPlayer.multiply(-1), {
                maxDistance: 100,
                type: "player",
            })[0]?.entity;

            if (!validRaycast) {
                validRaycast = this.entity.dimension.getBlockFromRay(laserStartLocation, directionToPlayer.multiply(-1), {
                    maxDistance: 100,
                })?.block;
            }

            const distanceToLaserCollision = validRaycast
                ? validRaycast instanceof Block
                    ? new V3(validRaycast.location).toGrid().subtractV3(laserStartLocation).length()
                    : new V3(validRaycast.location).subtractV3(laserStartLocation).length()
                : 50;

            const yClamped = directionToPlayerOriginal.y != directionToPlayer.y;
            this.lostSightOfPlayerTime = validRaycast instanceof Entity ? 0 : this.lostSightOfPlayerTime + 1;

            if (this.lostSightOfPlayerTime >= this.TrackingTicksAfterLostSight && !yClamped) {
                if (this.lostSightOfPlayerTime >= this.TrackingTicksAfterLostSight + this.LostSightOfPlayerShootDelay) {
                    this.laserBlast(laserStartLocation);
                }
                return;
            }

            const absoluteTargetLocation = laserStartLocation.addV3(directionToPlayer.multiply(-1).multiply(distanceToLaserCollision));

            if (!this.laserLockedOn) {
                this.targetLocation = this.lastTargetLocation
                    ? V3.lerp(this.lastTargetLocation, absoluteTargetLocation, this.LaserLerpSpeed)
                    : absoluteTargetLocation;
                if (this.LaserLerpSpeed < 1) {
                    this.LaserLerpSpeed += this.laserLerpRate;
                }
            } else {
                this.targetLocation = this.lastTargetLocation;
            }

            if (!this.targetLocation) return;
            this.directionToTarget = this.targetLocation.subtractV3(laserStartLocation).normalize();
            const rotationToTarget = this.directionToTarget.asYawPitchNegativeX();
            const distanceToTarget = this.targetLocation.subtractV3(laserStartLocation).length();
            const distanceBetweenTargetAndEndOfLaser = V3.distance(this.targetLocation, absoluteTargetLocation);

            let laserLength = 100;
            if (validRaycast instanceof Entity && distanceBetweenTargetAndEndOfLaser <= this.ValidDistanceLaserEndToTarget) {
                laserLength = distanceToTarget;
                this.laserOnTargetTime++;
            } else if (validRaycast instanceof Block) {
                laserLength = distanceToLaserCollision;
                this.laserOnTargetTime = 0;
            }

            this.entity.setProperty("gm1_ord:laser_rot_x", (rotationToTarget.pitch + 3) * 100);
            this.entity.setProperty("gm1_ord:laser_rot_y", -rotationToTarget.yaw * 100);

            this.entity.setProperty("gm1_ord:laser_length", laserLength * 100);

            this.laserLockedOn = this.laserOnTargetTime >= this.TicksUntilLockedOn ? true : this.laserLockedOn;

            if (this.laserLockedOn || this.laserAimTime >= 80) {
                this.entity.setProperty("gm1_ord:is_charging_laser", true);

                this.laserBlast(laserStartLocation);
            }
            this.lastTargetLocation = this.targetLocation;
        }, 1);
    }

    laserBlast(laserStartLocation: V3) {
        if (!this.targetLocation || !this.directionToTarget) return;
        this.laserChargeTime++;
        if (this.laserChargeTime > 40) {
            this.entity.setProperty("gm1_ord:is_charging_laser", false);
            if (this.laserCooldownTime <= 0) {
                this.entity.setProperty("gm1_ord:is_shooting_laser", true);
                const distanceToTarget = this.targetLocation.subtractV3(laserStartLocation).length();
                const damageAppliedEntities: Array<string> = [];
                for (let i = 0; i < distanceToTarget; i++) {
                    const lerpedLocation = laserStartLocation.addV3(this.directionToTarget.multiply(i));
                    const entitiesInsideLaser = EntityUtil.getEntities(
                        { maxDistance: 2, location: lerpedLocation, excludeTypes: ["gm1_ord:eggman"] },
                        this.entity.dimension
                    );
                    entitiesInsideLaser.forEach((entity) => {
                        if (!damageAppliedEntities.includes(entity.id)) {
                            damageAppliedEntities.push(entity.id);
                            EntityUtil.applyDamage(entity, 10, { damagingEntity: this.entity, cause: EntityDamageCause.entityAttack });
                        }
                    });
                }
                const directionToTarget = laserStartLocation.subtractV3(this.targetLocation).normalize();
                const validBlockExplosion = this.entity.dimension.getBlockFromRay(laserStartLocation, directionToTarget.multiply(-1), {
                    maxDistance: 100,
                })?.block;

                if (validBlockExplosion) {
                    this.entity.dimension.createExplosion(validBlockExplosion.location, this.ExplosionSize, {
                        breaksBlocks: this.ExplosionDestroyBlocks,
                    });
                }
            }
            this.laserCooldownTime++;
            if (this.laserCooldownTime >= this.LaserCooldownExit) {
                system.clearRun(this.laserRunnerID!);

                this.entity.setProperty("gm1_ord:is_using_gadget", false);
                this.entity.setProperty("gm1_ord:is_shooting_laser", false);
                this.entity.setProperty("gm1_ord:laser_length", 0);

                this.resetRotation = true;
                this.laserCooldownTime = 0;
                this.laserAimTime = 0;
                this.laserChargeTime = 0;
                this.laserOnTargetTime = 0;
                this.lostSightOfPlayerTime = 0;
                this.laserLockedOn = false;
                this.LaserLerpSpeed = this.initalLaserLerpSpeed;

                this.eggmanComponent.finishAction();
            }
        }
    }
}
