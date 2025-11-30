import GameData from "Game/GameData";
import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import MathUtil from "Utilities/MathUtil";
import Goal from "../Goal";

export default class extends Goal {
    tickEvery = 15;

    onEnter() {
        const chosenGreetingEmote = MathUtil.choose(GameData.CelebrationEmotes);
        this.setProperty("gm1_sky:is_emoting", chosenGreetingEmote.propertyNumber);
        if (MathUtil.chance(0.05)) {
            BroadcastUtil.translate("gm1_sky.emote.celebrating_easter", ["§b" + EntityStore.get(this.entity, "name") + "§r"]);
        } else {
            BroadcastUtil.translate("gm1_sky.emote.celebrating", ["§b" + EntityStore.get(this.entity, "name") + "§r"]);
        }
    }

    onExit() {
        AiPlayer.addSocialBattery(this.entity!, -10);
        this.setProperty("gm1_sky:is_emoting", 0);
    }
}
