import { Entity, ItemStack, Player, ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server";
import DragonPersistentData from "Dragon/DragonPersistentData";
import MobComponentManager from "MobComponents/MobComponentManager";

type IScriptEventData = Record<string, (eventData: ScriptEventCommandMessageAfterEvent) => void>;

let TargetToSet: Entity | null = null;
let TargetToSetTimestamp: number = 0;

export const ScriptEventData: IScriptEventData = {
    "gm1:ping": (eventData) => {
        const player = (eventData.sourceEntity || eventData.initiator) as Player | undefined;
        BroadcastUtil.say(`pong ${eventData.message}`, player ? [player] : undefined);
    },

    "gm1:debug_report": () => {
        DebugTimer.report();
    },

    "gm1:debug_report_10s": (eventData) => {
        console.warn("(DebugTimer) Clearing current counters and starting a 10s report");
        if (eventData.message.length) console.warn(`(DebugTimer) Report context ${eventData.message}`);
        DebugTimer.clear();
        system.runTimeout(() => {
            console.warn("(DebugTimer) End");
            DebugTimer.report();
        }, 10 * 20);
    },

    "gm1:clear_persistent_dragons": (eventData) => {
        const player = (eventData.sourceEntity || eventData.initiator) as Player | undefined;

        BroadcastUtil.say("Clearing persistent dragons", player ? [player] : undefined);
        DragonPersistentData.clearAllPersistentData();
    },

    "gm1:game_event": (eventData) => {
        const message = eventData.message;
        const args = message.split(/\s+/);
        const eventType = args[0];

        switch (eventType) {
            case "example": {
                BroadcastUtil.say(`Example event received: ${message}`);
                break;
            }
        }
    },

    "gm1_zen:is_target": ({ sourceEntity }) => {
        // console.warn("gm1_zen:is_target", sourceEntity?.typeId, Main.currentTick);
        if (!sourceEntity) {
            console.warn("sourceEntity does not exist, cannot check target");
            return;
        }

        TargetToSet = sourceEntity;
        TargetToSetTimestamp = Main.currentTick;
    },

    "gm1_zen:set_target": ({ sourceEntity }) => {
        // console.warn("gm1_zen:set_target", sourceEntity?.typeId, Main.currentTick);
        if (!sourceEntity) {
            console.warn("sourceEntity does not exist, cannot check target");
            return;
        }

        if (TargetToSetTimestamp === Main.currentTick && TargetToSet?.valid()) {
            // console.warn("gm1_zen:set_target2", sourceEntity?.typeId, Main.currentTick, TargetToSet?.typeId);
            EntityStore.temporary.set(sourceEntity, "Target", TargetToSet);
        }
    },
    "gm1_zen:target_lost": ({ sourceEntity }) => {
        // console.warn("gm1_zen:target_lost", sourceEntity?.typeId, Main.currentTick);
        if (!sourceEntity) {
            console.warn("sourceEntity does not exist, cannot check target");
            return;
        }

        EntityStore.temporary.set(sourceEntity, "Target", null);
    },
    "gm1_zen:debug_items": ({ sourceEntity }) => {
        if (!sourceEntity) {
            console.warn("sourceEntity does not exist, cannot check target");
            return;
        }

        InventoryUtil.giveItems(sourceEntity, [new ItemStack("gm1_common:configurables"), new ItemStack("gm1_common:debug_controller")]);
    },
    "gm1_zen:dragon_is_avoiding_mobs": ({ sourceEntity }) => {
        // console.warn("gm1_zen:target_lost", sourceEntity?.typeId, Main.currentTick);
        if (!sourceEntity) {
            console.warn("sourceEntity does not exist, cannot check target");
            return;
        }

        // console.warn("gm1_zen:dragon_is_avoiding_mobs", sourceEntity?.typeId, Main.currentTick);

        const dragonMobComponent = sourceEntity.getDragonMobComponent();
        dragonMobComponent?.onIsAvoidingMobs();
    },
    "gm1_zen:set_onboarding_book": (eventData) => {
        const message = eventData.message;
        const player = (eventData.sourceEntity || eventData.initiator) as Player;
        const validIconStates = [
            "home",
            "page_1_1",
            "page_1_2",
            "page_1_3",
            "page_1_4",
            "page_1_5",
            "page_2_1",
            "page_2_2",
            "page_2_3",
            "page_2_4",
            "page_2_5",
            "page_3_1",
            "page_3_2",
            "page_3_3",
            "page_3_4",
            "page_3_5",
            "credits",
            "page_4_1",
            "page_4_2",
            "page_4_3_subpage_1",
            "page_4_3_subpage_2",
            "page_4_4_subpage_1",
            "page_4_4_subpage_2_1",
            "page_4_4_subpage_2_2",
            "page_4_4_subpage_2_3",
            "page_4_4_subpage_2_4",
            "page_4_4_subpage_2_5",
            "page_5_1",
        ];
        if (!validIconStates.includes(message)) {
            return console.warn(`Invalid icon state ${message}. Valid states are: ${validIconStates.join(", ")}`);
        }
        player.setProperty("gm1_zen:page_number", validIconStates.indexOf(message));
        return;
    },
    "gm1_zen:intro_book_try_open": (eventData) => {
        const player = eventData.sourceEntity;

        if (!player) return;

        const bookComponent = MobComponentManager.getMobComponentOfEntity(player, "IntroBook");

        if (bookComponent) {
            bookComponent.isBookOpen = true;
        }
        return;
    },
    "gm1_zen:intro_book_try_close": (eventData) => {
        const player = eventData.sourceEntity;

        if (!player) return;

        const bookComponent = MobComponentManager.getMobComponentOfEntity(player, "IntroBook");

        if (bookComponent) {
            bookComponent.isBookOpen = false;
            system.runTimeout(() => {
                if (!bookComponent.isBookOpen) bookComponent.closeIntroBook();
            }, 1);
        }
        return;
    },
    "gm1_zen:set_dragon_book": (eventData) => {
        const message = eventData.message;
        const player = (eventData.sourceEntity || eventData.initiator) as Player;
        const validIconStates = ["home", "page_1_1", "page_2_1", "page_3_1", "page_4_1", "page_5_1"];
        if (!validIconStates.includes(message)) {
            return console.warn(`Invalid icon state ${message}. Valid states are: ${validIconStates.join(", ")}`);
        }
        player.setProperty("gm1_zen:page_number", validIconStates.indexOf(message));
        return;
    },
    "gm1_zen:dragon_book_try_open": (eventData) => {
        const player = eventData.sourceEntity;

        if (!player) return;

        const bookComponent = MobComponentManager.getMobComponentOfEntity(player, "DragonBook");

        if (bookComponent) {
            bookComponent.isBookOpen = true;
        }
        return;
    },
    "gm1_zen:dragon_book_try_close": (eventData) => {
        const player = eventData.sourceEntity;

        if (!player) return;

        const bookComponent = MobComponentManager.getMobComponentOfEntity(player, "DragonBook");

        if (bookComponent) {
            bookComponent.isBookOpen = false;
            system.runTimeout(() => {
                if (!bookComponent.isBookOpen) bookComponent.closeIntroBook();
            }, 1);
        }
        return;
    },
};
