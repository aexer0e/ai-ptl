import V3 from "Wrappers/V3";
import DragonSystem from "./DragonSystem";

export default class DragonWildSystem extends DragonSystem {
    lastAttackTimestamp = 0;
    inMovementTime = 0;
    wildFlyingDurationCache = 0;
    wildGroundedDurationCache = 0;

    hoverStatus: "ascending" | "descending" = "descending";
    currentLevitationAmplifier = -1;
    groundLocation: V3 | undefined;
    currentMoveDirection: V3 = this.getRandomMoveDirection();

    init() {
        this.wildGroundedDurationCache = MathUtil.random(this.comp.GroundedDurationRange[0], this.comp.GroundedDurationRange[1]);

        this.comp.setProp("is_flying_on_own", this.comp.entityF.getProperty("gm1_zen:is_flying_on_own") as boolean);
        this.comp.setProp("is_fly_attacking", false);
    }

    process() {
        const targetFromStore = EntityStore.temporary.get(this.comp.entityF, "Target");
        if (targetFromStore) this.comp.target = targetFromStore;
        else this.comp.target = undefined;

        this.processWildMovement();
    }

    processWildMovement() {
        const movementType = EntityStore.get(this.comp.entityF, "MovementType");
        if (movementType == "ground_movement") this.processWildGroundMovement();
        else this.processWildFlight();
        this.inMovementTime++;
    }

    processWildGroundMovement() {
        if (this.comp.CanFlyWhenWild && (this.inMovementTime > this.wildGroundedDurationCache || this.comp.entityF.isInWater)) {
            this.switchToFlight();
        }
    }

    switchToGroundMovement() {
        this.inMovementTime = 0;
        this.wildGroundedDurationCache = MathUtil.random(this.comp.GroundedDurationRange[0], this.comp.GroundedDurationRange[1]);
        EntityStore.set(this.comp.entityF, "MovementType", "ground_movement");
        this.comp.entityF.triggerEvent("gm1_zen:wild_ground_movement");
        this.comp.setProp("is_flying_on_own", false);
        this.comp.entityF.addEffect("slow_falling", 2 * 20, { showParticles: false });
        this.comp.timeout(() => this.comp.trustSystem.syncSpeed(), 1);
        this.comp.entityF.removeEffect("levitation");
        this.currentLevitationAmplifier = -1;
    }

    switchToFlight() {
        if (this.comp.timeSince(this.comp.wantsSystem.fedTick) < 10 * 60) {
            return; // Don't switch to flight if the dragon was just fed
        }

        this.inMovementTime = 0;
        this.wildFlyingDurationCache = MathUtil.random(this.comp.FlyingDurationRange[0], this.comp.FlyingDurationRange[1]);
        EntityStore.set(this.comp.entityF, "MovementType", "flight");
        this.comp.entityF.triggerEvent("gm1_zen:wild_flight");
        this.comp.setProp("is_flying_on_own", true);
        this.comp.timeout(() => this.comp.trustSystem.syncSpeed(), 1);
    }

    processWildFlight() {
        if (!this.comp.target || this.comp.timeSince(this.lastAttackTimestamp) < this.comp.MeleeFlightAttackCooldown) {
            if (this.inMovementTime > this.wildFlyingDurationCache) {
                this.switchToGroundMovement();
                return;
            }
        } else if (this.comp.target?.valid()) {
            this.comp.entityF.applyImpulse(
                V3.subtract(this.comp.target.location, this.comp.entityF.location).addY(0.4).normalize().multiply(0.1)
            );
            const distanceToTarget = V3.distance(this.comp.target.location, this.comp.entityF.location);
            if (distanceToTarget < 3) {
                //This magic number determines how much melee damage a wild dragon does when flying.
                this.comp.target.applyDamage(4);
                const directionToTarget = V3.subtract(this.comp.target.location, this.comp.entityF.location).setY(0).normalize();
                this.comp.target.applyKnockback(directionToTarget.x, directionToTarget.z, 0.5, 0.5);
                this.lastAttackTimestamp = Main.currentTick;

                this.comp.setProp("is_fly_attacking", true);
                this.comp.timeout(() => {
                    this.comp.setProp("is_fly_attacking", false);
                }, 5);
            }
            const directionToTarget = V3.subtract(this.comp.target.location, this.comp.entityF.location).setY(0).normalize();
            const rot = directionToTarget.asRotation();
            this.comp.entityF.setRotation(rot);

            return;
        }

        this.customFlyAround();
    }

    onIsHoveringOverWater() {
        const location = new V3(this.comp.entityF.location);
        if (this.groundLocation) {
            const directionToGround = V3.subtract(this.groundLocation, location).setY(0).normalize().multiply(MathUtil.random(0.05, 0.1));
            this.currentMoveDirection = directionToGround;
        }
        this.inMovementTime = Math.min(this.inMovementTime, 3 * 20);
    }
    hoverLoop() {
        const groundBlock = this.comp.entityF.dimension.getBlockFromRay(this.comp.entityF.location, new V3(0, -1, 0), {
            maxDistance: 40,
            includeLiquidBlocks: true,
        })?.block;

        if (!groundBlock || !groundBlock.isValid()) {
            this.hoverStatus = "descending";
            return;
        }

        if (this.comp.isCurrentTickNth(30)) {
            if (groundBlock.typeId == "minecraft:water" || groundBlock.typeId == "minecraft:flowing_water") {
                this.onIsHoveringOverWater();
            } else {
                this.groundLocation = new V3(groundBlock.location);
            }
        }

        const minLevel = groundBlock.location.y;

        const distanceToGround = this.comp.entityF.location.y - minLevel;

        const hoverDistanceToGround = this.comp.WildHoverDistanceToGround;
        this.hoverStatus = distanceToGround < hoverDistanceToGround ? "ascending" : "descending";

        let newLevitationLevel = -1;
        if (this.hoverStatus === "ascending") {
            newLevitationLevel = Math.round(MathUtil.lerpBound(0, this.comp.WildHoverVerticalSpeed, 35 / distanceToGround));
        }

        // console.warn(
        //     `${this.comp.entityF.getEffect("levitation")?.amplifier ?? -1}, ${this.comp.entityF.getVelocity().y}, ${distanceToGround}`
        // );

        if (newLevitationLevel !== this.currentLevitationAmplifier) {
            this.comp.entityF.removeEffect("levitation");
            if (newLevitationLevel >= 0) {
                this.comp.entityF.addEffect("levitation", 10000000, { amplifier: newLevitationLevel, showParticles: false });
            }
            this.currentLevitationAmplifier = newLevitationLevel;
        }
    }

    customFlyAround() {
        if (this.comp.isCurrentTickNth(this.comp.WildFlightDirectionChangeInterval)) {
            this.currentMoveDirection = this.getRandomMoveDirection();
        }
        this.hoverLoop();

        const velocity = new V3(this.comp.entityF.getVelocity());

        const currentYForce = velocity.y;
        const yForce = this.currentLevitationAmplifier >= 0 ? (this.currentLevitationAmplifier + 1) * 0.03 : -0.1;
        const yForceDelta = yForce - currentYForce;
        // this.comp.entityF.clearVelocity();
        this.comp.entityF.applyImpulse(this.currentMoveDirection.multiply(this.comp.milestone.speed * 5).setY(yForceDelta));

        const rot = velocity.normalize().asRotation();
        // console.warn(rot.y);
        // Clipboard.drawLine(
        //     this.comp.entityF.location,
        //     new V3(this.comp.entityF.location).addV3(new V3(this.comp.entityF.getViewDirection()).multiply(20)),
        //     1
        // );
        // Clipboard.drawLine(this.comp.entityF.location, new V3(this.comp.entityF.location).addV3(velocity.normalize().multiply(20)), 1);
        // console.warn(this.comp.entityF.getRotation().y);
        this.comp.entityF.setRotation(rot);
        // this.comp.entityF.teleport(this.comp.entityF.location, {
        //     rotation: rot,
        // });
    }

    getRandomMoveDirection() {
        return V3.random(-1, 1).setY(0).normalize().multiply(MathUtil.random(0.05, 0.1));
    }

    ensureIsFlying() {
        const movementType = EntityStore.get(this.comp.entityF, "MovementType");
        if (movementType == "ground_movement") {
            this.switchToFlight();
        }
    }
}
