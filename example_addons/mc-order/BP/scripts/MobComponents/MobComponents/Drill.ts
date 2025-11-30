import { Entity } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import BlockUtil from "Utilities/BlockUtil";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import DrillGadget from "./Gadgets/DrillGadget";
import MobComponent from "./MobComponent";

export default class Drill extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:drill"];

    processedBlocks: Set<string> = new Set();
    blockedDestroyedCount = 0;
    lifetime = 0;

    direction: V3 = new V3(0, 0, 0);

    spent = false;

    constructor(entity: Entity) {
        super(entity, 1);

        const targetLocation = EntityStore.temporary.get(entity, "targetLocation");
        if (!targetLocation) return;

        const location = new V3(entity.location);
        this.direction = targetLocation.subtractV3(location).normalize();
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        this.lifetime++;
        if (this.lifetime >= DrillGadget.DrillMaxLifetime) {
            this.entity.remove();
            return;
        }

        this.destroyBlocksInPath();

        if (this.spent) {
            this.entity.remove();
            return;
        }

        this.moveTowardsTarget();

        if (this.spent) {
            this.entity.remove();
            return;
        }
    }

    destroyBlocksInPath() {
        const location = new V3(this.entity!.location);
        const direction = new V3(this.entity!.getVelocity()).normalize();
        const center = location.addV3(direction.multiply(1.6));

        for (let x = -0.5; x <= 0.5; x++) {
            for (let y = -0.5; y <= 0.5; y++) {
                for (let z = -0.5; z <= 0.5; z++) {
                    const loc = center.add(x, y, z).floor();
                    const hash = loc.toString();
                    if (this.processedBlocks.has(hash)) continue;
                    const block = BlockUtil.GetBlock(this.entity!.dimension, loc);
                    if (!block?.isValid()) continue;
                    this.processedBlocks.add(hash);

                    if (block.isAir || block.isLiquid) continue;
                    this.entity!.dimension.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
                    this.blockedDestroyedCount++;

                    if (this.blockedDestroyedCount >= DrillGadget.DrillMaxBlocksToDestroy) {
                        this.spent = true;
                        return;
                    }
                }
            }
        }
    }

    moveTowardsTarget() {
        const newVelocity = this.direction.multiply(DrillGadget.DrillSpeed);

        this.entity!.clearVelocity();
        this.entity!.applyImpulse(newVelocity);

        const location = new V3(this.entity!.location);

        const nearbyPlayer = EntityUtil.getNearestPlayer(location.addY(-1), this.entity!.dimension, 1.5);
        if (nearbyPlayer) {
            const targetLocation = new V3(nearbyPlayer.location).addY(1);
            const directionToTarget = targetLocation.subtractV3(location).normalize();
            EntityUtil.applyDamage(nearbyPlayer, DrillGadget.DrillDamage);
            nearbyPlayer.applyKnockback(
                directionToTarget.x,
                directionToTarget.z,
                1 * DrillGadget.DrillKnockback,
                0.3 * DrillGadget.DrillKnockback
            );
            this.spent = true;
        }

        try {
            this.entity!.dimension.spawnParticle("gm1_ord:badnik_eggrobo_projectile_trail", location);
        } catch {}
    }
}
