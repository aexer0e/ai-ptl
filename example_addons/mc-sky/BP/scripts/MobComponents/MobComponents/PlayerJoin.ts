import { Entity, Player } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import MobComponent from "./MobComponent";

export default class PlayerJoin extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];
    entity: Player | null;

    hasMoved = false;
    spawnLocation: V3;

    constructor(entity: Entity) {
        super(entity, 5);
        this.onJoin();
    }

    onJoin() {
        const player = this.entity as Player;

        this.spawnLocation = new V3(player.location);

        if (!EntityStore.get(this.entity!, "playerInitialized")) this.initializePlayer();
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;
        if (this.hasMoved) return;

        const location = new V3(this.entity?.location);
        if (!this.spawnLocation) return;

        if (!location.sharesBlockWith(this.spawnLocation)) {
            this.onFirstMove();
            this.hasMoved = true;
        }
    }

    onFirstMove() {
        GameData.events.emit("PlayerFullyJoined", this.entity!);
        EntityStore.temporary.set(this.entity!, "playerFullyJoined", true);
    }

    initializePlayer() {
        EntityStore.set(this.entity!, "playerInitialized", true);
    }
}
