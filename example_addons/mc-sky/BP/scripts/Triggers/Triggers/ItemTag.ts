import { EntityItemComponent } from "@minecraft/server";
import GameData from "Game/GameData";
import Trigger from "./Trigger";

export default class ItemTag extends Trigger {
    init() {
        this.onWorldEvent("WorldAfter", "entitySpawn", (eventData) => {
            if (eventData.entity.typeId !== "minecraft:item") return;

            const itemComponent = eventData.entity.getComponent(EntityItemComponent.componentId) as EntityItemComponent;

            if (!itemComponent) return;

            const allItemWhiteList = [...GameData.AiPlayerItemWhitelist, ...GameData.ItemGroup["minecraft:all_armor"]];
            if (allItemWhiteList.includes(itemComponent.itemStack.typeId)) return;

            eventData.entity.addTag("item");
        });
    }
}
