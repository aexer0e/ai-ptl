import {
    BlockComponentOnPlaceEvent,
    BlockComponentPlayerDestroyEvent,
    BlockComponentTickEvent,
    BlockCustomComponent,
} from "@minecraft/server";
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V2 from "Wrappers/V2";
import V3 from "Wrappers/V3";
import AbstractBlockComponent from "../AbstractBlockComponent";

export default class SpringableBlockEntity extends AbstractBlockComponent {
    public static get identifier() {
        return "gm1_ord:springable_block_entity";
    }

    public static get events(): BlockCustomComponent {
        return {
            onPlace: this.onPlace.bind(this),
            onPlayerDestroy: this.onPlayerDestroy.bind(this),
            onTick: this.onTick.bind(this),
        };
    }

    private static onTick(event: BlockComponentTickEvent) {
        {
            this.onPlace(event as BlockComponentOnPlaceEvent);
        }
    }

    private static onPlace(event: BlockComponentOnPlaceEvent) {
        {
            // We have to cast our custom states to the list of of vanilla block states to avoid a type error. TODO: Remove when possible
            const hasAlreadyRegistered = event.block.permutation.getState("gm1_ord:spring_entity" as keyof BlockStateSuperset) as
                | boolean
                | undefined;
            if (hasAlreadyRegistered || hasAlreadyRegistered === undefined) return;
            const { block, dimension } = event;
            const blockLocation = new V3(block.location).toGridSelf();
            const springType = block.typeId;

            const direction = event.block.permutation.getState("minecraft:cardinal_direction");
            let entityRotation: V2;
            switch (direction) {
                case "north":
                    entityRotation = new V2(0, 0);
                    break;
                case "west":
                    entityRotation = new V2(0, -90);
                    break;
                case "south":
                    entityRotation = new V2(0, 180);
                    break;
                case "east":
                    entityRotation = new V2(0, 90);
                    break;
                default: // e.g. undefined
                    entityRotation = new V2(0, 0);
                    break;
            }

            const springEntity = EntityUtil.spawnEntityRotated(springType, blockLocation, entityRotation, dimension);
            // We have to cast our custom states to the list of of vanilla block states to avoid a type error. TODO: Remove when possible
            block.setPermutation(block.permutation.withState("gm1_ord:spring_entity" as keyof BlockStateSuperset, true));
            EntityStore.set(springEntity, "blockLocation", blockLocation);
        }
    }

    private static onPlayerDestroy(event: BlockComponentPlayerDestroyEvent) {
        {
            const blockLocation = new V3(event.block.location).toGridSelf();
            const destroyedBlock = event.destroyedBlockPermutation.type.id; // The spring id matches the block id
            const dimension = event.dimension;
            const springEntities = EntityUtil.getEntities({ location: blockLocation, type: destroyedBlock, closest: 1 }, dimension);
            springEntities.forEach((entity) => entity.remove());
        }
    }
}
