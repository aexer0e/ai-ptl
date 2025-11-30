import { Dimension, Entity, ItemStack, Player } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityUtil from "Utilities/EntityUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import PlayerMovement from "../PlayerMovement";
import PMPart from "./PMPart";

export default class PMRingMagnet extends PMPart {
    private alternator = true;

    caughtRings: Entity[] = [];
    ringSpeeds: number[] = [];

    constructor(player: Player, playerMovement: PlayerMovement) {
        super(player, playerMovement);
    }

    PullRings(dimension: Dimension) {
        // The alternator makes PullRings() cancel its execution every other tick.
        // PullRings() is called every tick, so doing this reduces lag from getEntities().
        // This requires doubling the impulse values applied to rings from what they would otherwise be, but the net effect on gameplay is indistinguishable, so it's worth the performance increase.
        this.alternator = !this.alternator;
        if (this.alternator) return;

        if (!this.charComp.currentCharacter) return;

        // If your inventory is full, ring magnetism needs to stop.
        const isInventoryFull = InventoryUtil.emptySlotsCount(this.player) === 0;
        const ringStacks = InventoryUtil.findItem(this.player, new ItemStack("gm1_ord:ring_spawn_egg"));
        if (isInventoryFull && ringStacks.length === 0) {
            if (this.caughtRings.length > 0) {
                this.caughtRings = [];
                this.ringSpeeds = [];
            }
            return;
        }

        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter!];

        const rings = dimension.getEntities({
            location: this.moveComp.playerLoc,
            maxDistance: charVals.ringMagnetRange,
            type: "gm1_ord:ring",
        });
        for (const ring of rings) {
            if (!this.caughtRings.includes(ring)) {
                this.caughtRings.push(ring);
                this.ringSpeeds.push(0);
            }
        }

        for (let i = this.caughtRings.length - 1; i >= 0; i--) {
            const ring = this.caughtRings[i];
            if (!EntityUtil.isValid(ring)) {
                this.caughtRings.splice(i, 1);
                this.ringSpeeds.splice(i, 1);
                continue;
            }
            if (this.ringSpeeds[i] < GameData.RingMagnetMaxSpeed)
                this.ringSpeeds[i] = MathUtil.clamp(this.ringSpeeds[i] + charVals.ringMagnetAcceleration, 0, GameData.RingMagnetMaxSpeed);
            const ringLoc = ring.location;
            const dir = V3.subtract(this.moveComp.playerLoc, ringLoc).normalize();
            ring.applyImpulse(dir.multiply(this.ringSpeeds[i]));
        }
    }
}
