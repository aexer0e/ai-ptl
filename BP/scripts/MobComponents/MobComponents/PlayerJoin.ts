import { Entity, ItemStack, Player } from "@minecraft/server";
import { MobComponentPlayer } from "./MobComponent";

export default class PlayerJoin extends MobComponentPlayer {
    static readonly PlayerStatsVersion = 1;
    static readonly Events: { PlayerFullyJoined: [player: Player] };

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
        EntityStore.temporary.set(this.entityF, "PlayerFullyJoined", true);
    }

    initializePlayer() {
        EntityStore.set(this.entityF, "PlayerInitialized", true);

        //InventoryUtil.clearInventory(this.entityF);
        //this.giveItems();
    }

    giveItems() {
        const player = this.entity as Player;

        const items = [] as { id: string; slot: number }[];

        items.forEach((item) => {
            const itemStack = new ItemStack(item.id);
            InventoryUtil.setInventoryItem(player, itemStack, item.slot);
        });
    }
}
