import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.setTrust(0, AiPlayerWrapper.getNearestPlayer(this.entity)!);
    }

    onExit() {}
}
