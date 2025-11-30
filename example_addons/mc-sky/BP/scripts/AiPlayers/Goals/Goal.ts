import { Entity } from "@minecraft/server";
import AiPlayer from "AiPlayers/AiPlayerWrapper";

export default abstract class extends AiPlayer {
    constructor(entity: Entity) {
        super(entity);
    }
}
