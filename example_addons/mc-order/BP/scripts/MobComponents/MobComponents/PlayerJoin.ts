import { Entity, ItemStack, Player } from "@minecraft/server";
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
        if (!EntityStore.get(this.entity!, "playerGivenBook")) this.giveBook();
    }

    process() {
        if (this.hasMoved) return;
        if (!EntityUtil.isValid(this.entity)) return;

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

    giveBook() {
        const playerLocation = new V3(this.entity!.location);
        const book = new ItemStack("gm1_ord:intro_book", 1);
        EntityUtil.spawnItem(book, playerLocation, this.entity!.dimension);
        EntityStore.set(this.entity!, "playerGivenBook", true);
    }
}
