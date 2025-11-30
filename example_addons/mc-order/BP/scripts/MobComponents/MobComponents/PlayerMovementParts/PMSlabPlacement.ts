import { Block, Player, world } from "@minecraft/server";
import GameData from "Game/GameData";
import ReplacedBlock from "Order/ReplacedBlock";
import BlockUtil from "Utilities/BlockUtil";
import DebugTimer from "Utilities/DebugTimer";
import V3 from "Wrappers/V3";
import PlayerMovement from "../PlayerMovement";
import PMPart from "./PMPart";

export default class PMSlabPlacement extends PMPart {
    recentlyProcessedBlockLocationsBreaking: Set<number> = new Set();
    recentlyProcessedBlockLocationsSlabRaycasts: Set<number> = new Set();
    recentlyProcessedBlockLocationsSlabs: Set<number> = new Set();
    replacedBlocks: ReplacedBlock[] = [];

    constructor(player: Player, playerMovement: PlayerMovement) {
        super(player, playerMovement);

        this.moveComp.onWorldEvent("WorldAfterEvents", "playerLeave", (event) => {
            if (event.playerId !== this.player.id) return;

            if (world.getAllPlayers().length > 1) {
                // If in multiplayer and this is just another player leaving, invisible slabs can be cleaned up normally
                this.moveComp.ClearAllReplacedBlocks();
            } else if (this.replacedBlocks.length > 0) {
                // If the world is being closed, Bedrock will not permit any block changes, and the list has to be saved for next time
                const savedData = world.getDynamicProperty("gm1_ord:leftover_invisible_slabs");
                if (typeof savedData === "string") {
                    this.replacedBlocks.concat(JSON.parse(savedData));
                }
                world.setDynamicProperty("gm1_ord:leftover_invisible_slabs", JSON.stringify(this.replacedBlocks));
            }
        });
    }

    ProcessStepUp() {
        if (this.moveComp.momentum < GameData.MinMomentumForSlabs) return;
        if (!this.player.isSprinting) return;

        this.moveComp.playerLoc = new V3(this.player.location);

        const rayOffsets = [new V3(0, 0, 0), new V3(0, 1, 0), new V3(0, 2, 0), new V3(0, -1, 0)];
        if (this.player.getVelocity().y <= GameData.ExtraSlabVerticalVelocity) {
            for (let i = 1; i <= GameData.ExtraSlabLayers; i++) {
                rayOffsets.push(new V3(0, -1 - i, 0));
            }
        }

        const facingDir = new V3(this.player.getViewDirection()).setY(0).normalize();
        DebugTimer.countEndAndStart("PM.CastRayToPlaceStair");
        rayOffsets.forEach((offset) => {
            this.CastRayToPlaceStair(this.moveComp.playerLoc.addV3(offset), facingDir.clean());
            this.CastRayToPlaceStair(this.moveComp.playerLoc.addV3(offset), facingDir.rotateAroundY(0.075).clean());
            this.CastRayToPlaceStair(this.moveComp.playerLoc.addV3(offset), facingDir.rotateAroundY(-0.075).clean());
        });

        DebugTimer.countEnd();
    }

    PruneReplacedBlocks() {
        DebugTimer.countEndAndStart("PM.ReplaceBlocks");
        for (let i = this.replacedBlocks.length - 1; i >= 0; i--) {
            const block: ReplacedBlock = this.replacedBlocks[i];
            //TODO Check if the block is still a stair before setting it back.
            if (V3.distance(this.moveComp.playerLoc, block.location) > 8) {
                //TODO This could break if the player changes dimensions
                world.getDimension(block.dimension).setBlockType(block.location, block.typeId);
                this.replacedBlocks.splice(i, 1);
            }
        }
    }

    CastRayToPlaceStair(rayOrigin: V3, rayDirection: V3) {
        DebugTimer.countStart("PM.CastRayToPlaceStair.Vars");
        DebugTimer.countEndAndStart("PM.CastRayToPlaceStair.Raycast");
        const rayHit = this.moveComp.dimension.getBlockFromRay(rayOrigin, rayDirection, {
            maxDistance: GameData.SlabRaycastDistance,
            includePassableBlocks: false,
            excludeTypes: ["gm1_ord:invisible_slab"],
        });
        DebugTimer.countEndAndStart("PM.CastRayToPlaceStair.HandleRayHit");
        if (rayHit) {
            const blockPos = new V3(rayHit.block.location);

            const id = V3.asBlockLocationId(blockPos.x, blockPos.y, blockPos.z);
            if (this.recentlyProcessedBlockLocationsSlabRaycasts.has(id)) {
                DebugTimer.countEnd();
                return;
            }
            this.recentlyProcessedBlockLocationsSlabRaycasts.add(id);
            this.moveComp.timeout(() => {
                this.recentlyProcessedBlockLocationsSlabRaycasts.delete(id);
            }, 15);
            // this.entity.dimension.spawnParticle("gm1_ord:ring_sparkle", blockPos.addY(1));
            const blockAbovePos = {
                x: blockPos.x,
                y: blockPos.y + 1,
                z: blockPos.z,
            };

            const blockAbove = BlockUtil.GetBlock(this.moveComp.dimension, blockAbovePos);
            if (blockAbove !== undefined && this.CanBlockBeWalkedThrough(blockAbove.typeId)) {
                const hitLocation = blockPos.toGrid();
                // const hitLocation = blockPos.toGrid().moveTowards(this.moveComp.playerLoc, 1);
                this.HandleRayHit({ hitLocation, typeId: rayHit.block.typeId });
            }
        }
        DebugTimer.countEnd();
    }

    HandleRayHit({ hitLocation, typeId }: { hitLocation: V3; typeId: string }) {
        // Early check to avoid API calls if they're not necessary, full check in PlaceStair()
        if (typeId === "minecraft:cactus") return;

        // this.player.dimension.spawnParticle("minecraft:redstone_torch_dust_particle", hitLocation);
        // const playerFrontLoc = this.moveComp.playerLoc.addV3(new V3(this.player.getViewDirection()).multiply(0.8));

        const locations = [
            hitLocation.add(-1, 0, -1),
            hitLocation.add(-1, 0, 0),
            hitLocation.add(-1, 0, 1),
            hitLocation.add(0, 0, -1),
            // hitLocation.add(0, 0, 0),
            hitLocation.add(0, 0, 1),
            hitLocation.add(1, 0, -1),
            hitLocation.add(1, 0, 0),
            hitLocation.add(1, 0, 1),
            // this.moveComp.playerLoc,
            // hitLocation.add(0, 0, 0),
            // hitLocation.add(-0.5, 0, -0.5),
            // hitLocation.add(-0.5, 0, 0.5),
            // hitLocation.add(0.5, 0, -0.5),
            // hitLocation.add(0.5, 0, 0.5),
            // playerFrontLoc.add(-0.5, 0, -0.5),
            // playerFrontLoc.add(-0.5, 0, 0.5),
            // playerFrontLoc.add(0.5, 0, -0.5),
            // playerFrontLoc.add(0.5, 0, 0.5),
        ].filter((loc) => {
            const id = V3.asBlockLocationId(loc.x, loc.y, loc.z);
            if (this.recentlyProcessedBlockLocationsSlabs.has(id)) {
                return false;
            }
            this.recentlyProcessedBlockLocationsSlabs.add(id);
            this.moveComp.timeout(() => {
                this.recentlyProcessedBlockLocationsSlabs.delete(id);
            }, 15);

            // this.player.dimension.spawnParticle("gm1_ord:ring_sparkle", loc);
            return true;
        });

        const blockLocInFront = this.moveComp.playerLoc.addV3(new V3(this.player.getViewDirection()).multiply(0.8));
        const blockInFront = BlockUtil.GetBlock(this.moveComp.dimension, blockLocInFront);
        if (blockInFront && !this.CanBlockBeWalkedThrough(blockInFront.typeId)) {
            locations.push(blockLocInFront);
        }

        for (const placeLocation of locations) {
            const blockToReplace = BlockUtil.GetBlock(this.moveComp.dimension, placeLocation);
            if (blockToReplace) {
                DebugTimer.countStart("PM.PlaceStair");
                this.PlaceStair(blockToReplace);
                DebugTimer.countEnd();
            }
        }
    }

    PlaceStair(blockToReplace: Block) {
        if (blockToReplace.typeId === "gm1_ord:invisible_slab") {
            return;
        }

        const blockAboveByOne: Block | undefined = blockToReplace.above(1);
        if (blockToReplace && this.IsBlockReplaceable(blockToReplace) === false) {
            return;
        }
        if (blockAboveByOne && this.CanBlockBeWalkedThrough(blockAboveByOne.typeId) === false) {
            return;
        }
        const blockAboveByTwo: Block | undefined = blockToReplace.above(2);
        if (blockAboveByTwo && this.CanBlockBeWalkedThrough(blockAboveByTwo.typeId) === false) {
            return;
        }
        const blockBelow: Block | undefined = blockToReplace.below(1);
        const blockBelowTypeId = blockBelow?.typeId;
        if (
            blockBelow &&
            (this.CanBlockBeWalkedThrough(blockBelow.typeId) || (blockBelowTypeId && GameData.DontPlaceSlabsOn.has(blockBelowTypeId)))
        ) {
            return;
        }

        // Do not place blocks next to cactus
        const directions = [new V3(1, 0, 0), new V3(-1, 0, 0), new V3(0, 0, 1), new V3(0, 0, -1)];
        blockToReplace.location;
        for (const direction of directions) {
            blockToReplace.location;
            if (blockToReplace) {
                const placeLocation = new V3(blockToReplace.location).addV3(direction);
                const neighborBlock = BlockUtil.GetBlock(this.moveComp.dimension, placeLocation);
                if (neighborBlock && neighborBlock.typeId === "minecraft:cactus") return;
            }
        }

        // Record block being replaced
        const replacedBlock = new ReplacedBlock(blockToReplace.typeId, new V3(blockToReplace.location), this.moveComp.dimension.id);
        this.replacedBlocks.push(replacedBlock);

        // Cleanly replace double-tall blocks
        if (GameData.DoubleTallReplaceables.has(blockToReplace.typeId)) {
            // We can assume that we're replacing the lower half of double tall blocks and just turn the block above into air
            if (blockAboveByOne) {
                this.moveComp.dimension.setBlockType(blockAboveByOne.location, "minecraft:air");
            }
        }

        // Replace slab
        // this.entity.dimension.spawnParticle("gm1_ord:ring_sparkle", V3.grid(blockToReplace.location));
        this.moveComp.dimension.setBlockType(blockToReplace.location, "gm1_ord:invisible_slab");
    }

    CanBlockBeWalkedThrough(blockType: string): boolean {
        if (GameData.SingleTallReplaceables.has(blockType) || GameData.DoubleTallReplaceables.has(blockType)) return true;
        else return false;
    }

    IsBlockReplaceable(blockToTest: Block): boolean {
        return GameData.SingleTallReplaceables.has(blockToTest.typeId) || GameData.DoubleTallReplaceables.has(blockToTest.typeId);
    }
}
