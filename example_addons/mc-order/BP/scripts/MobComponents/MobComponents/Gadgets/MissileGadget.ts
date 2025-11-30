import { Entity, EntityProjectileComponent, system } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Gadget from "./Gadget";

export default class MissileGadget extends Gadget {
    readonly gadgetId = 2;

    readonly MissileBurstCount = 8; // The count of missiles to shoot in a burst
    readonly MissileBurstInterval = 10; // The interval between each missile in a burst
    readonly MissileBurstCooldown = 200; // The cooldown between each burst
    static readonly MissileBlastRange = 3; // The range of the missile blast
    static readonly MissilesCauseFire = false; // Whether the missiles cause fire
    static readonly MissilesBreakBlocks = true; // Whether the missiles break blocks
    static readonly MissileDownwardVelocity = 0.2; // The speed of the missile when it falls down
    readonly MissileTelegraphTime = 3 * 20; // The number of ticks the missile attack is telegraphed before executing
    readonly MissileSpread = 4;
    readonly MissileXOffsets = [-1.5, 1.5, -0.5, 0.5];

    MissileSpawnIndex = 0;
    telegraphRunnerID = 0;
    shootRunnerIDs: number[] = [];
    finishRunnerID = 0;

    shootMissileBurst() {
        const player = this.eggmanComponent.getNearestPlayer();
        // If there's no player nearby when Eggman tries to shoot missiles, cancel the action
        if (!player) {
            this.eggmanComponent.finishAction();
            return;
        }

        this.entity.setProperty("gm1_ord:is_charging_gadget", true);
        this.telegraphRunnerID = this.timeout(() => {
            this.entity.setProperty("gm1_ord:is_charging_gadget", false);
            this.entity.setProperty("gm1_ord:is_using_gadget", true);
            const countToShoot = this.MissileBurstCount;
            const interval = this.MissileBurstInterval;
            this.shootMissilesAtInterval(player, countToShoot, interval);
            this.telegraphRunnerID = 0;
        }, this.MissileTelegraphTime);
    }

    shootMissilesAtInterval(player: Entity, count: number, interval: number) {
        for (let i = 0; i < count; i++) {
            this.shootRunnerIDs.push(
                this.timeout(() => this.shootMissile(player), i * interval, this.isValidConditionalMult([this.entity, player]))
            );
        }
        this.finishRunnerID = this.timeout(() => {
            this.entity.setProperty("gm1_ord:is_using_gadget", false);
            this.eggmanComponent.finishAction();
            this.shootRunnerIDs = [];
            this.finishRunnerID = 0;
        }, count * interval);
    }

    shootMissile(player: Entity) {
        const location = new V3(this.entity.location.x, this.entity.location.y + 3, this.entity.location.z);
        const viewDirection = new V3(this.entity.getViewDirection());
        const playerLocation = new V3(player.getHeadLocation());

        // Select the spawn offset in a cycle
        this.MissileSpawnIndex = (this.MissileSpawnIndex + 1) % this.MissileXOffsets.length;
        const xOffset = this.MissileXOffsets[this.MissileSpawnIndex];
        // Compute the spawn location using the cyclic offset
        const spawnLocation = location
            .addV3(viewDirection.multiply(-2)) // Move backward
            .addV3(new V3(xOffset, 1.5, 0));
        const targetLocation = playerLocation.addRandomness(this.MissileSpread);
        targetLocation.x = Math.round(targetLocation.x);
        targetLocation.z = Math.round(targetLocation.z);

        const targetBlock = this.entity.dimension.getTopmostBlock({ x: targetLocation.x, z: targetLocation.z });
        if (targetBlock) {
            targetLocation.y = targetBlock.location.y + 1;
        }

        const projectile = EntityUtil.spawnEntity("gm1_ord:missile", spawnLocation, this.entity.dimension);
        const projectileComponent = projectile.getComponent(EntityProjectileComponent.componentId) as EntityProjectileComponent;

        const directionToTarget = targetLocation.subtractV3(spawnLocation).setY(0).normalize();

        projectileComponent.shoot(directionToTarget.multiply(0.4).setY(2), { uncertainty: 0 });

        EntityStore.temporary.set(projectile, "targetLocation", targetLocation);

        const indicatorEntity = EntityUtil.spawnEntity("gm1_ord:missile_marker", targetLocation, this.entity.dimension);
        EntityStore.linkEntities(projectile, indicatorEntity);
    }

    stopShooting() {
        if (this.telegraphRunnerID !== 0) system.clearRun(this.telegraphRunnerID);
        if (this.finishRunnerID !== 0) system.clearRun(this.finishRunnerID);
        for (const shootRunnerID of this.shootRunnerIDs) system.clearRun(shootRunnerID);
    }
}
