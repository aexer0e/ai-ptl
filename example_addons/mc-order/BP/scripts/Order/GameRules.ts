import { GameRule, GameRuleChangeAfterEvent, system, world } from "@minecraft/server";
import SoundData from "Game/Sound/SoundData";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EventUtil from "Utilities/EventUtil";
import Runner from "Utilities/Runner";

export default class GameRules {
    static init() {
        EventUtil.subscribe("WorldAfterEvents", "gameRuleChange", this.onGameRuleChange);
        Runner.timeout(this.onReload, 50);
    }

    static onGameRuleChange(event: GameRuleChangeAfterEvent) {
        const { rule, value } = event;

        if (rule !== GameRule.MobGriefing) return;
        if (value) return;

        BroadcastUtil.say({ translate: "gm1_ord.game_rule.mob_griefing.disable_warning" });

        world.getAllPlayers().forEach((player) => {
            SoundData.game_rule.mob_griefing_disable.play(player);
        });
    }

    static onReload() {
        if (world.gameRules.mobGriefing) return;

        BroadcastUtil.say({ translate: "gm1_ord.game_rule.mob_griefing.disable_warning" });

        system.run(() => {
            world.getAllPlayers().forEach((player) => {
                SoundData.game_rule.mob_griefing_disable.play(player);
            });
        });
    }
}
