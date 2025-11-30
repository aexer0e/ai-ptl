import { Entity, GameMode, Player } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EntityUtil from "Utilities/EntityUtil";
import Runner from "Utilities/Runner";
import MobComponent from "./MobComponent";

export default class IntroBook extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];

    player: Player;
    introBook: Entity | null = null;
    isBookOpen: boolean = false;

    constructor(entity: Entity) {
        super(entity);

        this.player = entity as Player;

        this.onWorldEvent("WorldAfterEvents", "itemStartUse", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.itemStack.typeId !== "gm1_ord:intro_book") return;
            if (entity.id !== eventData.source.id) return;
            this.openIntroBook();
        });
    }

    openIntroBook() {
        this.introBook = this.player.dimension.spawnEntity("gm1_ord:intro_book", this.player.location) ?? null;

        if (!this.introBook) {
            BroadcastUtil.debug("Failed to spawn intro book entity.");
            return;
        }

        EntityStore.set(this.introBook, "bookUserId", this.player.id); // only set bookUserId when player open the book

        Runner.timeout(() => {
            if (this.player.getGameMode() === GameMode.creative) this.player.setGameMode(GameMode.spectator);
            this.player.runCommand("/dialogue open @e[type=gm1_ord:intro_book,c=1] @s gm1_ord:1-home");
        }, 2);
    }

    closeIntroBook() {
        if (this.player.getGameMode() === GameMode.spectator) this.player.setGameMode(GameMode.creative);

        this.introBook?.remove();
    }
}
