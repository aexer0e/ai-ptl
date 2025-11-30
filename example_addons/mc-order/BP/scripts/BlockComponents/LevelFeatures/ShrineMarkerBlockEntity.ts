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

export default class ShrineMarkerBlockEntity extends AbstractBlockComponent {
    public static get identifier() {
        return "gm1_ord:shrine_marker_block_entity";
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
            const hasAlreadyRegistered = event.block.permutation.getState("gm1_ord:shrine_marker_entity" as keyof BlockStateSuperset) as
                | boolean
                | undefined;
            if (hasAlreadyRegistered || hasAlreadyRegistered === undefined) return;
            const { block, dimension } = event;
            const blockLocation = new V3(block.location).toGridSelf();
            const ShrineMarkerType = block.typeId;

            const shrineMarkerEntity = EntityUtil.spawnEntity(ShrineMarkerType, blockLocation, dimension);
            // We have to cast our custom states to the list of of vanilla block states to avoid a type error. TODO: Remove when possible
            block.setPermutation(block.permutation.withState("gm1_ord:shrine_marker_entity" as keyof BlockStateSuperset, true));
            EntityStore.set(shrineMarkerEntity, "blockLocation", blockLocation);
        }
    }

    private static onPlayerDestroy(event: BlockComponentPlayerDestroyEvent) {
        {
            const blockLocation = new V3(event.block.location).toGridSelf();
            const destroyedBlock = event.destroyedBlockPermutation.type.id; // The chaos emerald id matches the block id
            const dimension = event.dimension;
            const ShrineMarkerEntities = EntityUtil.getEntities({ location: blockLocation, type: destroyedBlock, closest: 1 }, dimension);
            ShrineMarkerEntities.forEach((entity) => entity.remove());
        }
    }
}
