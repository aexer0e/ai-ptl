import { Entity, GameMode, Player, system } from "@minecraft/server";
import MobComponent from "./MobComponent";

export default class DragonBook extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];

    player: Player;
    dragonBook: Entity | null = null;
    isBookOpen: boolean = false;

    constructor(entity: Entity) {
        super(entity);

        this.player = entity as Player;

        this.onWorldEvent("WorldAfterEvents", "itemStartUse", (eventData) => {
            if (entity.id !== eventData.source.id) return;
            if (eventData.itemStack.typeId !== "gm1_zen:dragon_book") return;
            if (!EntityUtil.isValid(this.entity)) return;
            this.openIntroBook();
        });
    }

    openIntroBook() {
        this.dragonBook = this.player.dimension.spawnEntity("gm1_zen:dragon_book", this.player.location) ?? null;

        if (!this.dragonBook) {
            BroadcastUtil.debug("Failed to spawn dragon book entity.");
            return;
        }

        EntityStore.set(this.dragonBook, "bookUserId", this.player.id); // only set bookUserId when player open the book

        system.runTimeout(() => {
            if (this.player.getGameMode() === GameMode.creative) this.player.setGameMode(GameMode.spectator);
            this.player.runCommand("/dialogue open @e[type=gm1_zen:dragon_book,c=1] @s gm1_zen_dragon:1-home");
        }, 2);
    }

    closeIntroBook() {
        if (this.player.getGameMode() === GameMode.spectator) this.player.setGameMode(GameMode.creative);

        this.dragonBook?.remove();
    }
}
