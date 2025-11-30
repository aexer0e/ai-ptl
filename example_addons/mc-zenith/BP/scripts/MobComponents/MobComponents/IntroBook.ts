import { Entity, GameMode, Player, system } from "@minecraft/server";
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
            if (entity.id !== eventData.source.id) return;
            if (eventData.itemStack.typeId !== "gm1_zen:intro_book") return;
            if (!EntityUtil.isValid(this.entity)) return;
            this.openIntroBook();
        });
    }

    openIntroBook() {
        this.introBook = this.player.dimension.spawnEntity("gm1_zen:intro_book", this.player.location) ?? null;

        if (!this.introBook) {
            BroadcastUtil.debug("Failed to spawn intro book entity.");
            return;
        }

        EntityStore.set(this.introBook, "bookUserId", this.player.id); // only set bookUserId when player open the book

        system.runTimeout(() => {
            if (this.player.getGameMode() === GameMode.creative) this.player.setGameMode(GameMode.spectator);
            this.player.runCommand("/dialogue open @e[type=gm1_zen:intro_book,c=1] @s gm1_zen_onboarding:1-home");
        }, 2);
    }

    closeIntroBook() {
        if (this.player.getGameMode() === GameMode.spectator) this.player.setGameMode(GameMode.creative);

        this.introBook?.remove();
    }
}
