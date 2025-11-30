import { ItemStack, system } from "@minecraft/server";
import GameData from "Game/GameData";
import InventoryUtil from "Utilities/InventoryUtil";
import Goal from "./Goal";

export default class extends Goal {
    complete = false;

    onEnter() {
        const inventory = InventoryUtil.getAllInventoryItems(this.entity);
        const allFood = GameData.ItemGroup["minecraft:all_food"];
        const foodFound = inventory.filter((item) => allFood.includes(item.itemStack.typeId));
        const bestFood = allFood.find((food) => foodFound.some((item) => item.itemStack.typeId === food));

        if (!bestFood) {
            this.complete = true;
            return;
        }

        this.setSelectedItem(bestFood);
        const foodValue = GameData.FoodValues[bestFood as keyof (typeof GameData)["FoodValues"]]!;

        this.setProperty("gm1_sky:is_using_item", "eating");
        this.entity.addEffect("slowness", 40, { showParticles: false, amplifier: 1 });

        const eatSoundRunner = this.interval(() => {
            this.entity.dimension.playSound("random.eat", this.entity.location);
        }, 4);

        this.timeout(() => {
            this.complete = true;
            this.addHunger(foodValue.hungerRegeneration);
            this.addHealth(foodValue.healthRegeneration);
            InventoryUtil.clearItem(this.entity, new ItemStack(bestFood, 1));
            system.clearRun(eatSoundRunner);
        }, 40);
    }

    onExit() {
        this.setSelectedItem("air");
        this.setProperty("gm1_sky:is_using_item", "idle");
    }
}
