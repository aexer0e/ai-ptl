import { Entity } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import MobComponent from "./MobComponent";

export default class MissileMarker extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:missile_marker"];

    constructor(entity: Entity) {
        super(entity, 20);
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        const missileEntity = EntityStore.getLinkedEntity(this.entity!);
        if (!missileEntity) this.entity.remove();
    }
}
