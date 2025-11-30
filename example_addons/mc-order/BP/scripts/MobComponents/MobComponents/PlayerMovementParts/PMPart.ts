import { Player } from "@minecraft/server";
import CharActivation from "../CharActivation";
import PlayerMovement from "../PlayerMovement";

export default class PMPart {
    protected player: Player;
    protected moveComp: PlayerMovement;
    charComp: CharActivation;

    constructor(player: Player, playerMovement: PlayerMovement) {
        this.player = player;
        this.moveComp = playerMovement;
    }
}
