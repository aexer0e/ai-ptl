import { Entity, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import V3 from "Wrappers/V3";
import { MobComponentPlayer } from "./MobComponent";

export default class extends MobComponentPlayer {
    static readonly PlayerStatsVersion = 1;
    static readonly Events: { PlayerFullyJoined: [player: Player] };
    static readonly Configs = [
        ConfigFactory.toggle("Should emit events", true), //
    ];

    hasMoved = false;
    spawnLocation: V3;

    constructor(entity: Entity) {
        super(entity, 5);
        this.onJoin();
    }

    onJoin() {
        const player = this.entity as Player;

        this.spawnLocation = new V3(player.location);
        if (!EntityStore.get(player, "PlayerInitialized")) this.initializePlayer();
        if (!EntityStore.get(player, "playerGivenBook")) this.giveBook();

        GameData.events.emit("PlayerJoined", player);

        ControlsUtil.unlockControls(player);
        ControlsUtil.showHUD(player);
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;
        if (this.hasMoved) return;

        const location = new V3(this.entity?.location);
        if (!this.spawnLocation) return;

        if (V3.distance(location, this.spawnLocation) > 0.5) {
            this.onFirstMove();
            this.hasMoved = true;
        }
    }

    onFirstMove() {
        GameData.events.emit("PlayerFullyJoined", this.entityF);
        EntityStore.temporary.set(this.entityF, "PlayerFullyJoined", true);
    }

    initializePlayer() {
        EntityStore.set(this.entityF, "PlayerInitialized", true);

        InventoryUtil.clearInventory(this.entityF);
        this.giveItems();

        // Player rotation is initialized in PlayerSplash, because I need to wait for load screen
    }

    giveItems() {
        const player = this.entity as Player;

        const items = [
            // { id: "gm1:blank_bow", slot: 0 },
            // { id: "gm1:blank_knife", slot: 1 },
            // { id: "gm1:blank_objective_menu", slot: 8 },
            // { id: "gm1:help_menu", slot: 7 },
        ] as { id: string; slot: number }[];

        items.forEach((item) => {
            const itemStack = new ItemStack(item.id);
            if (item.id == "gm1:help_menu") {
                itemStack.lockMode = ItemLockMode.inventory;
            } else {
                itemStack.lockMode = ItemLockMode.slot;
            }
            InventoryUtil.setInventoryItem(player, itemStack, item.slot);
        });
    }

    giveBook() {
        const playerLocation = new V3(this.entityF.location);
        const book = new ItemStack("gm1_zen:intro_book", 1);
        EntityUtil.spawnItem(book, playerLocation, this.entityF!.dimension);
        EntityStore.set(this.entityF!, "playerGivenBook", true);
    }
}
