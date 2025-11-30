import { Entity, EntityRideableComponent } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import EntityStore from "Store/Entity/EntityStore";
import WorldStore from "Store/World/WorldStore";
import EntityUtil from "Utilities/EntityUtil";
import MobComponent from "./MobComponent";

export default class AiBed extends MobComponent {
    static readonly EntityTypes = ["gm1_sky:ai_bed"];

    constructor(entity: Entity) {
        super(entity);
        this.subscribeShowMenu(entity);
    }

    subscribeShowMenu(entity: Entity) {
        this.onWorldEvent("WorldAfter", "playerInteractWithEntity", (eventData) => {
            if (eventData.target.id !== this.entity!.id) return;

            const aiPlayerList: Entity[] = EntityUtil.getEntities({ type: "gm1_sky:ai_player" }, entity.dimension) || [];
            const currentBedUserName = (EntityStore.get(entity, "bedUserName") as string) ?? "<empty>";

            const dropDownList = aiPlayerList
                .filter((aiPlayer) => EntityStore.get(aiPlayer, "assignedAiBedEntityId") === "")
                .map(AiPlayerWrapper.getAiPlayerName);

            dropDownList.unshift("<empty>");
            if (currentBedUserName !== "<empty>") dropDownList.unshift(currentBedUserName);

            const form = new ModalFormData()
                .title("Ai Bed Assignment")
                .textField("Current Bed User:", "<empty>", currentBedUserName)
                .dropdown("Assign Bed To:", dropDownList, 0)
                .submitButton("Save Changes");

            form.show(eventData.player).then((response) => {
                if (!response.formValues) return;

                const selectedIndex = response.formValues[1] as number;
                const selectedPlayerName = dropDownList[selectedIndex];

                if (selectedPlayerName === currentBedUserName) return;

                entity.nameTag = selectedPlayerName;

                const oldAssignedAiPlayer = this.findAiPlayerByName(aiPlayerList, currentBedUserName);
                if (oldAssignedAiPlayer) {
                    const rideableComponent = this.entity?.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent;
                    if (rideableComponent) rideableComponent.ejectRider(oldAssignedAiPlayer);
                    EntityStore.set(oldAssignedAiPlayer, "assignedAiBedEntityId", "");
                }

                EntityStore.set(entity, "bedUserName", selectedPlayerName);

                const registeredBedIdList = (WorldStore.get("RegisteredBedIdList") as string[]) ?? [];
                if (selectedPlayerName === "<empty>") {
                    const index = registeredBedIdList.indexOf(entity.id);
                    if (index !== -1) {
                        registeredBedIdList.splice(index, 1);
                    }
                } else {
                    if (!registeredBedIdList.includes(entity.id)) {
                        registeredBedIdList.push(entity.id);
                    }

                    // assign bed to a new Ai Player
                    const newAssignedAiPlayer = this.findAiPlayerByName(aiPlayerList, selectedPlayerName);
                    if (newAssignedAiPlayer) {
                        EntityStore.set(newAssignedAiPlayer, "assignedAiBedEntityId", entity.id);
                    }
                }

                WorldStore.set("RegisteredBedIdList", registeredBedIdList);
            });
        });
    }

    findAiPlayerByName(aiPlayerList: Entity[], name: string): Entity | undefined {
        return aiPlayerList.find((player) => AiPlayerWrapper.getAiPlayerName(player) === name);
    }
}
