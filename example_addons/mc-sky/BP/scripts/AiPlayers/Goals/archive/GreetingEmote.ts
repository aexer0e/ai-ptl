import GameData from "Game/GameData";
import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import MathUtil from "Utilities/MathUtil";
import Goal from "../Goal";

export default class extends Goal {
    tickEvery = 15;

    onEnter() {
        const chosenGreetingEmote = MathUtil.choose(GameData.WavingEmotes);
        this.setProperty("gm1_sky:is_emoting", chosenGreetingEmote.propertyNumber);
        if (MathUtil.chance(0.05)) {
            BroadcastUtil.translate("gm1_sky.emote.wave_easter", ["§b" + EntityStore.get(this.entity, "name") + "§r"]);
        } else {
            BroadcastUtil.translate("gm1_sky.emote.wave", ["§b" + EntityStore.get(this.entity, "name") + "§r"]);
        }
        GameData.events.emit("aiPlayerMessage", this.entity, EntityStore.get(this.entity, "name"), "Hello", 0.5);
    }

    onExit() {
        AiPlayer.addSocialBattery(this.entity!, -10);
        this.setProperty("gm1_sky:is_emoting", 0);
    }
}
