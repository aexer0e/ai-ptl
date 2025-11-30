import { Block } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityUtil from "Utilities/EntityUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import V3 from "Wrappers/V3";
import Goal from "../Goal";

export default class extends Goal {
    foundBlock: Block | undefined;
    complete = false;
    onEnter() {
        this.triggerEvent("go_to_furnace.add");

        this.onWorldEvent("WorldAfter", "dataDrivenEntityTrigger", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.entity.id !== this.entity.id) return;
            if (eventData.eventId != "gm1_sky:furnace_reached") return;

            this.foundBlock = this.findBlock({ min: new V3(-1, -1, -1), max: new V3(1, 2, 1) }, (block) => {
                return block.typeId == "minecraft:furnace";
            });

            if (!this.foundBlock) {
                this.complete = true;
                return;
            }

            const allItems = InventoryUtil.getAllInventoryItems(this.entity!);
            if (allItems.length === 0) {
                this.complete = true;
                return;
            }

            const furnaceLocationString = new V3(this.foundBlock.location).asString();

            const oreItemStack = allItems
                .filter((item) => {
                    return GameData.ItemGroup["minecraft:ore"].includes(item.itemStack.typeId);
                })
                .sort((a, b) => {
                    return a.itemStack.amount - b.itemStack.amount;
                })[0];

            if (oreItemStack) {
                const cmd = `replaceitem block ${furnaceLocationString} slot.container 0 ${oreItemStack.itemStack.typeId} ${oreItemStack.itemStack.amount}`;
                this.entity.runCommand(cmd);
                InventoryUtil.clearInventorySlot(this.entity!, oreItemStack.slot);
            }

            const fuelItemStack = allItems
                .filter((item) => {
                    return GameData.ItemGroup["minecraft:log"].includes(item.itemStack.typeId);
                })
                .sort((a, b) => {
                    return a.itemStack.amount - b.itemStack.amount;
                })[0];

            if (fuelItemStack) {
                const cmd = `replaceitem block ${furnaceLocationString} slot.container 1 ${fuelItemStack.itemStack.typeId} ${fuelItemStack.itemStack.amount}`;
                this.entity.runCommand(cmd);
                InventoryUtil.clearInventorySlot(this.entity!, fuelItemStack.slot);
            }

            this.entity.addEffect("slowness", 20, { amplifier: 100, showParticles: false });
            this.swingArm();
        });
    }

    tickEvery = 1;
    onTick() {
        if (this.foundBlock) {
            const rotation = V3.subtract(this.foundBlock.location, this.entity.getHeadLocation()).normalize().asRotation();
            this.entity.setRotation(rotation);
        }
    }

    onExit() {
        this.triggerEvent("go_to_furnace.remove");
    }
}
