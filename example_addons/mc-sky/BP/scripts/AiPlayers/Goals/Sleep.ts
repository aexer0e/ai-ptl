import { Block, EntityRideableComponent } from "@minecraft/server";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import Goal from "./Goal";

export default class extends Goal {
    foundBlock: Block | undefined;

    // start sleep
    onEnter() {
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Sleep", 1);

        const aiBedEntityId = EntityStore.get(this.entity, "assignedAiBedEntityId") as string;
        if (!aiBedEntityId) return;
        const aiBedEntity = EntityUtil.getEntityById(aiBedEntityId);
        if (!aiBedEntity) return;

        if (aiBedEntity.nameTag !== AiPlayerWrapper.getAiPlayerName(this.entity)) return;

        this.triggerEvent("go_to_ai_bed.add");

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;

            const rideableComponent = aiBedEntity?.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent;
            if (!rideableComponent) return;
            rideableComponent.addRider(this.entity);
        });
    }

    // stop sleep
    onExit() {
        this.triggerEvent("go_to_ai_bed.remove");

        const aiBedEntity = EntityUtil.getEntities(
            { location: this.entity.location, type: "gm1_sky:ai_bed", closest: 1, maxDistance: 1 },
            this.entity.dimension
        )[0];

        if (aiBedEntity) {
            const rideableComponent = aiBedEntity.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent;
            if (rideableComponent) rideableComponent.ejectRider(this.entity);
        }
    }
}
