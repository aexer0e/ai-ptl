import { Block } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import InventoryUtil from "Utilities/InventoryUtil";
import V3 from "Wrappers/V3";
import Goal from "./Goal";

export default class extends Goal {
    readonly ReturnWhenComplete = false;

    miningBlock = false;
    blockToMine?: Block;
    complete = false;
    firstMinedBlockLocation: V3 | null = null;
    hasNoTargetTime = 0;

    onEnter() {
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "ChopTree", 1);
        this.equipTool();
        this.triggerEvent("go_to_block.add");
        this.entity!.addTag("go_to_block");
        const target = this.setAndGetTargetBlock();
        if (!target) {
            this.hasNoTargetTime++;
            return;
        }
    }

    setAndGetTargetBlock() {
        const blockData = EntityStore.temporary.get(this.entity, "rcBlockCache").log;
        if (!blockData?.block?.isValid()) {
            return;
        }
        EntityStore.temporary.set(this.entity, "targetBlock", {
            block: blockData.block,
            markerLocation: blockData.faceLocation!.addV3(blockData.block.location),
        });
        return blockData.block;
    }

    onExit() {
        this.setSelectedItem("air");
        this.triggerEvent("go_to_block.remove");
        this.entity!.removeTag("go_to_block");
        this.setProperty("gm1_sky:is_using_item", "idle");
    }

    tickEvery = 5;
    onTick() {
        const target = this.setAndGetTargetBlock();
        if (!target) {
            this.hasNoTargetTime++;
            if (this.hasNoTargetTime > 10) {
                this.complete = true;
            }
            return;
        }

        if (this.firstMinedBlockLocation && this.firstMinedBlockLocation.distanceTo(this.entity.location) > 7) {
            this.complete = true;
            if (this.ReturnWhenComplete) return;
        }

        this.hasNoTargetTime = 0;

        if (!this.miningBlock) {
            this.blockToMine = this.findBlockToMine();
            if (!this.blockToMine) {
                return;
            }

            this.entity.addEffect("slowness", 2 * 20, { amplifier: 100, showParticles: false });
            this.miningBlock = true;

            this.breakBlock(this.blockToMine!);

            this.setProperty("gm1_sky:is_using_item", "swinging");
            this.timeline({
                2: () => {
                    this.setProperty("gm1_sky:is_using_item", "idle");
                },
                2.5: () => {
                    if (!this.firstMinedBlockLocation) this.firstMinedBlockLocation = new V3(this.blockToMine!.location);
                    this.miningBlock = false;
                    this.emitAction("mineBlock");

                    this.entity.addTag("has_iron");
                },
            });
        }

        if (this.miningBlock && this.blockToMine) {
            const rotation = V3.subtract(this.blockToMine.location, this.entity.getHeadLocation()).normalize().asRotation();
            this.entity.setRotation(rotation);
        }
    }

    findBlockToMine() {
        const location = new V3(this.entity.location);
        const volume = { min: location.add(-1, -1, -1), max: location.add(1, 4, 1) };
        const blockLocations = V3.getBlocksInVolume(volume);

        for (const blockLocation of blockLocations) {
            const block = this.entity?.dimension.getBlock(blockLocation);
            if (GameData.ItemGroup["minecraft:log"].includes(block!.typeId)) {
                return block;
            }
        }
    }

    equipTool() {
        const inventory = InventoryUtil.getAllInventoryItems(this.entity);
        const allTools = GameData.ItemGroup["minecraft:axe"];
        const toolsFound = inventory.filter((item) => allTools.includes(item.itemStack.typeId));
        const bestTool = allTools.find((tool) => toolsFound.some((item) => item.itemStack.typeId === tool));

        if (!bestTool) return this.setSelectedItem("air");

        this.setSelectedItem(bestTool);
    }
}
