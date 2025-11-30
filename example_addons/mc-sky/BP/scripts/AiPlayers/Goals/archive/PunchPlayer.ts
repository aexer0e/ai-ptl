import Goal from "../Goal";

export default class extends Goal {
    onEnter() {
        this.entity!.triggerEvent("gm1_sky:attack_players.add");
        this.entity?.addTag("attack_players");
        {
            this.setProperty("gm1_sky:is_sneaking", true);
        }
    }

    onExit() {
        this.entity!.triggerEvent("gm1_sky:attack_players.remove");
        this.entity?.removeTag("attack_players");
        this.entity?.addTag("punched_player");
        {
            this.setProperty("gm1_sky:is_sneaking", false);
        }
    }
}
