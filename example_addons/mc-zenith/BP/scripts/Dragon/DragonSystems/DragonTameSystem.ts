import { EntityHealthComponent, EntityTameableComponent, Player } from "@minecraft/server";
import DragonPersistentData, { DragonPersistentDataEntry } from "Dragon/DragonPersistentData";
import DragonSystem from "./DragonSystem";

export default class DragonTameSystem extends DragonSystem {
    process() {
        //if the dragon is being ridden, or if the dragon's stamina isn't full, call processTamedflight.
        if (this.comp.flightSystem.isBeingRidden || this.comp.flightSystem.stamina != this.comp.flightSystem.comp.milestone.maxStamina) {
            this.comp.flightSystem.processTamedFlight();
        }

        if (this.comp.isCurrentTickNth(15)) {
            const healthComponent = this.comp.entityF.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;

            const dataToSet = {
                trust: this.comp.getPersistentProperty("Trust"),
                health: healthComponent.currentValue,
            } as Partial<DragonPersistentDataEntry>;

            if (typeof this.comp.flightSystem.stamina === "number") {
                dataToSet.stamina = this.comp.flightSystem.stamina;
            }

            DragonPersistentData.updatePersistentData(this.comp.entityId, dataToSet);
        }
    }

    tameTo(player: Player) {
        this.comp.entityF.triggerEvent("gm1_zen:tame");
        this.comp.timeout(() => {
            const tameComponent = this.comp.entityF.getComponent(EntityTameableComponent.componentId) as EntityTameableComponent;
            tameComponent.tame(player);
        }, 1);

        // DragonPersistentData.updatePersistentData(this.comp.entityId, { ownerId: player.id });
        const idToSet = WorldStore.get("NextPersistentDragonId");
        DragonPersistentData.addPersistentData(this.comp.entityId, {
            version: 0,
            ownerId: player.id,
            isSaddled: false,
            hasArmor: false,
            trust: this.comp.getPersistentProperty("Trust"),
            nameTag: "",
            id: idToSet,
            typeId: this.comp.entityF.typeId,
            entityId: this.comp.entityId,
        });
        EntityStore.set(this.comp.entityF, "PersistentDragonId", idToSet);

        this.comp.setProp("is_flying_on_own", false);
    }

    isTamed() {
        const tameComponent = this.comp.entityF.getComponent(EntityTameableComponent.componentId) as EntityTameableComponent;
        if (!tameComponent) return false;
        return tameComponent.isTamed;
    }
}
