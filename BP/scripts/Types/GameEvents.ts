import { Entity, ItemStack, Player } from "@minecraft/server";
import { MobComponentEvents } from "MobComponents/MobComponents/index";
import { TriggerEvents } from "Triggers/Triggers/index";

export type GameEvents = MobComponentEvents &
    TriggerEvents & {
        PlayerGivenItem: [player: Player, item: ItemStack];
        EntityLoaded: [entity: Entity];
        PlayerJoined: [player: Player];
    };
