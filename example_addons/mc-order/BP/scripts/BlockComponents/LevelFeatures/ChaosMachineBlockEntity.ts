import {
    BlockComponentOnPlaceEvent,
    BlockComponentPlayerDestroyEvent,
    BlockComponentTickEvent,
    BlockCustomComponent,
} from "@minecraft/server";
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import AbstractBlockComponent from "../AbstractBlockComponent";

export default class ChaosEmeraldBlockEntity extends AbstractBlockComponent {
    public static get identifier() {
        return "gm1_ord:chaos_machine_block_entity";
    }

    public static get events(): BlockCustomComponent {
        return {
            onPlace: this.onPlace.bind(this),
            onPlayerDestroy: this.onPlayerDestroy.bind(this),
            onTick: this.onTick.bind(this),
            // onPlayerInteract: this.onPlayerInteract.bind(this),
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
            const hasAlreadyRegistered = event.block.permutation.getState("gm1_ord:chaos_machine_entity" as keyof BlockStateSuperset) as
                | boolean
                | undefined;
            if (hasAlreadyRegistered || hasAlreadyRegistered === undefined) return;
            const { block, dimension } = event;
            const blockLocation = new V3(block.location).toGridSelf();
            const ChaosEmeraldType = block.typeId;

            const chaosMachineEntity = EntityUtil.spawnEntity(ChaosEmeraldType, blockLocation, dimension);
            // We have to cast our custom states to the list of of vanilla block states to avoid a type error. TODO: Remove when possible
            block.setPermutation(block.permutation.withState("gm1_ord:chaos_machine_entity" as keyof BlockStateSuperset, true));
            EntityStore.set(chaosMachineEntity, "blockLocation", blockLocation);
        }
    }

    private static onPlayerDestroy(event: BlockComponentPlayerDestroyEvent) {
        {
            const blockLocation = new V3(event.block.location).toGridSelf();
            const destroyedBlock = event.destroyedBlockPermutation.type.id; // The entity id matches the block id
            const dimension = event.dimension;
            const ChaosEmeraldEntities = EntityUtil.getEntities({ location: blockLocation, type: destroyedBlock, closest: 1 }, dimension);
            ChaosEmeraldEntities.forEach((entity) => {
                entity.remove();
            });
        }
    }

    // private static onPlayerInteract(event: BlockComponentPlayerInteractEvent) {
    //     {
    //         if (!event.player) return;
    //         const blockLocation = new V3(event.block.location).toGridSelf();
    //         const destroyedBlock = event.block.type.id; // The entity id matches the block id
    //         const dimension = event.dimension;
    //         const ChaosEmeraldEntities = EntityUtil.getEntities({ location: blockLocation, type: destroyedBlock, closest: 1 }, dimension);
    //         ChaosEmeraldEntities.forEach((entity) => {
    //             const mobComponent = MobComponentManager.getInstanceOfComponent(ChaosMachine, entity);
    //             mobComponent.onInteraction(event.player!);
    //         });
    //     }
    // }
}
