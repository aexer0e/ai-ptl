import {
    BlockComponentPlayerDestroyEvent,
    BlockComponentStepOnEvent,
    BlockComponentTickEvent,
    BlockCustomComponent,
} from "@minecraft/server";
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import AbstractBlockComponent from "../AbstractBlockComponent";

export default class MegaRingPlatform extends AbstractBlockComponent {
    public static get identifier() {
        return "gm1_ord:mega_ring_platform";
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
            this.onPlace(event as BlockComponentStepOnEvent);
        }
    }

    private static onPlace(event: BlockComponentStepOnEvent) {
        {
            // We have to cast our custom states to the list of of vanilla block states to avoid a type error. TODO: Remove when possible
            const hasAlreadyRegistered = event.block.permutation.getState("gm1_ord:init" as keyof BlockStateSuperset) === true;

            if (hasAlreadyRegistered) return;
            const { block, dimension } = event;
            const blockLocation = new V3(block.location).toGridSelf();

            EntityUtil.spawnEntity("gm1_ord:mega_ring", { ...blockLocation, y: blockLocation.y + 0.5 }, dimension);
            // We have to cast our custom states to the list of of vanilla block states to avoid a type error. TODO: Remove when possible
            block.setPermutation(block.permutation.withState("gm1_ord:init" as keyof BlockStateSuperset, true));
        }
    }

    private static onPlayerDestroy(event: BlockComponentPlayerDestroyEvent) {
        {
            const blockLocation = new V3(event.block.location).toGridSelf();
            const dimension = event.dimension;
            const entities = EntityUtil.getEntities(
                { location: { ...blockLocation, y: blockLocation.y + 0.5 }, type: "gm1_ord:mega_ring", closest: 1 },
                dimension
            );
            entities.forEach((entity) => entity.remove());
        }
    }
}
