import {
    BlockComponentOnPlaceEvent,
    BlockComponentPlayerDestroyEvent,
    BlockComponentPlayerInteractEvent,
    BlockComponentTickEvent,
    BlockCustomComponent,
    Entity,
    EntityRideableComponent,
} from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import EntityStore from "Store/Entity/EntityStore";
import WorldStore from "Store/World/WorldStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import AbstractBlockComponent from "./AbstractBlockComponent";

export default class AiBedBlockEntity extends AbstractBlockComponent {
    public static get identifier() {
        return "gm1_sky:ai_bed_block_entity";
    }

    public static get events(): BlockCustomComponent {
        return {
            onPlace: this.onPlace.bind(this),
            onPlayerDestroy: this.onPlayerDestroy.bind(this),
            onTick: this.onTick.bind(this),
            onPlayerInteract: this.onPlayerInteract.bind(this),
        };
    }

    private static findAiPlayerByName(aiPlayerList: Entity[], name: string): Entity | undefined {
        return aiPlayerList.find((player) => AiPlayerWrapper.getAiPlayerName(player) === name);
    }

    private static onPlayerInteract(event: BlockComponentPlayerInteractEvent) {
        if (!event.player) return;
        const entity = EntityUtil.getEntities(
            { location: event.block.location, type: "gm1_sky:ai_bed", closest: 1, maxDistance: 2 },
            event.dimension
        )[0];
        if (!entity) return;

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

        form.show(event.player).then((response) => {
            if (!response.formValues) return;

            const selectedIndex = response.formValues[1] as number;
            const selectedPlayerName = dropDownList[selectedIndex];

            if (selectedPlayerName === currentBedUserName) return;

            entity.nameTag = selectedPlayerName;

            const oldAssignedAiPlayer = this.findAiPlayerByName(aiPlayerList, currentBedUserName);
            if (oldAssignedAiPlayer) {
                const rideableComponent = entity?.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent;
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
    }

    private static onTick(event: BlockComponentTickEvent) {
        {
            this.onPlace(event as BlockComponentOnPlaceEvent);
        }
    }

    private static onPlace(event: BlockComponentOnPlaceEvent) {
        {
            const hasAlreadyRegistered = event.block.permutation.getState("gm1_sky:ai_bed_entity") as boolean | undefined;
            if (hasAlreadyRegistered || hasAlreadyRegistered === undefined) return;
            const { block, dimension } = event;
            const blockLocation = new V3(block.location).toGridSelf();

            const aiBedEntity = EntityUtil.spawnEntity(block.typeId, blockLocation, dimension);
            block.setPermutation(block.permutation.withState("gm1_sky:ai_bed_entity", true));
            EntityStore.set(aiBedEntity, "blockLocation", blockLocation);
            aiBedEntity.nameTag = "<empty>";
        }
    }

    private static onPlayerDestroy(event: BlockComponentPlayerDestroyEvent) {
        {
            const blockLocation = new V3(event.block.location).toGridSelf();
            const destroyedBlock = event.destroyedBlockPermutation.type.id;
            const dimension = event.dimension;
            const aiBedEntity = EntityUtil.getEntities({ location: blockLocation, type: destroyedBlock, closest: 1 }, dimension)[0];

            const registeredBedIdList = WorldStore.get("RegisteredBedIdList");
            const bedIndex = registeredBedIdList.indexOf(aiBedEntity.id);
            if (bedIndex !== -1) {
                registeredBedIdList.splice(bedIndex, 1);
                WorldStore.set("RegisteredBedIdList", registeredBedIdList);
            }

            const bedUserName = EntityStore.get(aiBedEntity, "bedUserName") as string;
            if (bedUserName !== "<empty>") {
                const assignedAiPlayer = EntityUtil.getEntities({ type: "gm1_sky:ai_player" }, dimension).find(
                    (aiPlayer) => AiPlayerWrapper.getAiPlayerName(aiPlayer) === bedUserName
                );

                if (assignedAiPlayer) {
                    EntityStore.set(assignedAiPlayer, "assignedAiBedEntityId", "");
                }
            }
            aiBedEntity.remove();
        }
    }
}
