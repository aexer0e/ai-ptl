import { EntityTypeFamilyComponent } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import Trigger from "./Trigger";

export default class MonstersKilled extends Trigger {
    init() {
        this.onWorldEvent("WorldAfter", "entityDie", (eventData) => {
            const families = eventData.deadEntity.getComponent("minecraft:type_family") as EntityTypeFamilyComponent;
            if (eventData.damageSource.damagingEntity?.typeId != "gm1_sky:ai_player") return;

            if (families.getTypeFamilies().includes("monster")) {
                let monstersKilled = EntityStore.get(eventData.damageSource.damagingEntity, "monstersKilled");
                monstersKilled++;
                EntityStore.set(eventData.damageSource.damagingEntity, "monstersKilled", monstersKilled);
            }
        });
    }
}
