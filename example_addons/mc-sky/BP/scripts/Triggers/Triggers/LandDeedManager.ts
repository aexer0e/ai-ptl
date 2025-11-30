import { EntityHurtAfterEvent, ItemStack } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Trigger from "./Trigger";

type BlockOffsets = {
    [key: string]: {
        x: number;
        y: number;
        z: number;
    };
};

export default class LandDeedManager extends Trigger {
    blockOffsets: BlockOffsets = {
        Up: { x: 0, y: 1, z: 0 },
        Down: { x: 0, y: -1, z: 0 },
        North: { x: 0, y: 0, z: -1 },
        South: { x: 0, y: 0, z: 1 },
        East: { x: 1, y: 0, z: 0 },
        West: { x: -1, y: 0, z: 0 },
    };

    grid = new V3(0.5, 0, 0.5);

    init() {
        this.onWorldEvent("WorldAfter", "itemStartUse", (eventData) => {
            if (eventData.itemStack?.typeId != "gm1_sky:land_deed") return;
            const interactBlock = eventData.source.getBlockFromViewDirection({ maxDistance: 6.0 });
            if (!interactBlock) return;
            const blockLocation = V3.add(interactBlock.block.location, this.grid);
            const blockOffset = this.blockOffsets[interactBlock.face];
            const spawnLocation = V3.add(blockLocation, blockOffset);
            EntityUtil.spawnEntity("gm1_sky:land_deed_banner", spawnLocation, eventData.source.dimension);
        });

        this.onWorldEvent("WorldAfter", "entityHurt", (eventData) => {
            if (eventData.hurtEntity.typeId != "gm1_sky:land_deed_banner") return;
            if (eventData.damageSource.damagingEntity?.typeId == "minecraft:player") {
                this.onHurtByPlayer(eventData);
            } else if (eventData.damageSource.damagingEntity?.typeId == "gm1_sky:ai_player") {
                this.onHurtByAiPlayer(eventData);
            }
        });
    }

    onHurtByPlayer(eventData: EntityHurtAfterEvent) {
        const deedItem = new ItemStack("gm1_sky:land_deed", 1);
        const dimension = eventData.hurtEntity.dimension;
        EntityUtil.spawnItem(deedItem, eventData.hurtEntity.location, dimension);
        eventData.hurtEntity.triggerEvent("gm1_sky:instant_despawn");
    }

    onHurtByAiPlayer(eventData: EntityHurtAfterEvent) {
        if (EntityUtil.isValid(eventData.damageSource.damagingEntity)) {
            eventData.hurtEntity.setProperty("gm1_sky:claimed", true);
            eventData.damageSource.damagingEntity?.setProperty("gm1_sky:has_land", true);
            EntityStore.set(eventData.hurtEntity, "titleOfDeed", EntityStore.get(eventData.damageSource.damagingEntity, "name"));
            eventData.hurtEntity.nameTag = "Home of " + EntityStore.get(eventData.hurtEntity, "titleOfDeed");
        }
    }
}
