import { Entity } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import MobComponent from "./MobComponent";

export const joinedNames = new Set<string>();

export default class extends MobComponent {
    static readonly EntityTypes = ["gm1_sky:follow_marker"];

    constructor(entity: Entity) {
        super(entity, 5);
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        const aiPlayer = EntityStore.getLinkedEntity(this.entity);
        if (!aiPlayer) {
            this.entity.remove();
            return;
        }

        const targetItem = EntityStore.temporary.get(aiPlayer, "targetItem");
        if (EntityUtil.isValid(targetItem)) {
            this.entity.teleport(targetItem.location);
            return;
        }

        const targetBlock = EntityStore.temporary.get(aiPlayer, "targetBlock");
        if (targetBlock?.block.isValid()) {
            this.entity.teleport(targetBlock.markerLocation);
            return;
        }
    }
}
