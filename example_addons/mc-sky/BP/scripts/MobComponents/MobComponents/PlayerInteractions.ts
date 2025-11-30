import { Entity, Player } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityUtil from "Utilities/EntityUtil";
import MobComponent from "./MobComponent";

export default class extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];
    entity: Player | null;

    isSneaking = false;

    constructor(entity: Entity) {
        super(entity, 1);

        this.onWorldEvent("WorldAfter", "playerEmote", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;

            if (this.entity.id !== eventData.player.id) return;

            GameData.events.emit("PlayerEmoted", this.entity, eventData.personaPieceId);
        });
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        const isSneaking = this.entity!.isSneaking;

        if (isSneaking !== this.isSneaking) {
            GameData.events.emit("PlayerSneakingChanged", this.entity, isSneaking);
            this.isSneaking = isSneaking;
        }

        // if (isEmoting !== this.isEmoting) {
        //     GameData.events.emit("PlayerEmotingChanged", this.entity, isEmoting);
        //     this.isEmoting = isEmoting;
        // }
    }
}
