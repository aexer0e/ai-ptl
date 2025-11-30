import { Entity } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import MissileGadget from "./Gadgets/MissileGadget";
import MobComponent from "./MobComponent";

export default class Missile extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:missile"];

    constructor(entity: Entity) {
        super(entity, 1);
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        const velocity = new V3(this.entity.getVelocity());

        if (velocity.y < 0) {
            this.homeToTarget();
        }

        this.onWorldEvent("WorldAfterEvents", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entityId) return;

            if (eventData.eventId == "gm1_ord:death_target") {
                this.entity.dimension.createExplosion(this.entity.location, MissileGadget.MissileBlastRange, {
                    causesFire: MissileGadget.MissilesCauseFire,
                    breaksBlocks: MissileGadget.MissilesBreakBlocks,
                });

                const indicatorEntity = EntityStore.getLinkedEntity(this.entity!);

                indicatorEntity?.remove();
                this.entity.remove();
            }
        });
    }

    homeToTarget() {
        const targetLocation = EntityStore.temporary.get(this.entity!, "targetLocation");
        if (!targetLocation) return;

        const entityLocation = new V3(this.entity!.location);
        const currentVelocity = new V3(this.entity!.getVelocity());

        const directionToTarget = targetLocation.subtractV3(entityLocation).normalize().setY(-MissileGadget.MissileDownwardVelocity);
        const newVelocity = directionToTarget.addV3(currentVelocity.multiply(-0.2));

        try {
            this.entity?.applyImpulse(newVelocity);
        } catch {}
    }
}
