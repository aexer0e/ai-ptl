import { Entity, EntityRidingComponent } from "@minecraft/server";
import EntityUtil from "Utilities/EntityUtil";
import MobComponent from "./MobComponent";

export default class EggmanRider extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:eggman_rider"];

    constructor(entity: Entity) {
        super(entity, 50);
        const ride = this.getRide();
        if (!ride) {
            this.entity!.remove();
            return;
        }
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        const ride = this.getRide();
        if (!ride) {
            this.entity!.remove();
            return;
        }
    }

    getRide() {
        const rideComponent = this.entity?.getComponent(EntityRidingComponent.componentId) as EntityRidingComponent | undefined;
        return rideComponent?.entityRidingOn;
    }
}
