import { EquipmentSlot, Player, system, world } from "@minecraft/server";

const aetherLensId = "ns_ptl:aether_lens";
const emitterBlockId = "ns_ptl:universal_emitter";
const revealRadius = 20; // blocks
const checkInterval = 10; // ticks (0.5 seconds)

export default class AetherLensManager {
    private static playersWearingLens: Set<string> = new Set();

    static init() {
        // Check player equipment periodically
        system.runInterval(() => this.tick(), checkInterval);

        BroadcastUtil.debug("AetherLensManager initialized");
    }

    private static tick() {
        for (const player of world.getAllPlayers()) {
            try {
                const isWearingLens = this.isPlayerWearingLens(player);
                const wasWearingLens = this.playersWearingLens.has(player.id);

                if (isWearingLens && !wasWearingLens) {
                    // Player just equipped the lens
                    this.playersWearingLens.add(player.id);
                    this.revealEmittersForPlayer(player);
                } else if (isWearingLens && wasWearingLens) {
                    // Player is still wearing lens, keep updating visibility
                    this.revealEmittersForPlayer(player);
                } else if (!isWearingLens && wasWearingLens) {
                    // Player just removed the lens
                    this.playersWearingLens.delete(player.id);
                    this.hideEmittersForPlayer(player);
                }
            } catch {
                // Player may be invalid
            }
        }
    }

    private static isPlayerWearingLens(player: Player): boolean {
        try {
            const equipment = player.getComponent("minecraft:equippable");
            if (!equipment) return false;

            const helmet = equipment.getEquipment(EquipmentSlot.Head);
            return helmet?.typeId === aetherLensId;
        } catch {
            return false;
        }
    }

    private static revealEmittersForPlayer(player: Player) {
        const emitterLocations = EmitterManager.getEmittersNear(player.location, player.dimension, revealRadius);

        for (const location of emitterLocations) {
            try {
                const block = player.dimension.getBlock(location);
                if (block && block.typeId === emitterBlockId) {
                    // Set the block state to visible
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const permutation = block.permutation.withState("ns_ptl:visible" as any, true);
                    block.setPermutation(permutation);
                }
            } catch {
                // Block may be in unloaded chunk
            }
        }
    }

    private static hideEmittersForPlayer(player: Player) {
        // Hide all emitters the player was seeing
        const emitterLocations = EmitterManager.getEmittersNear(player.location, player.dimension, revealRadius * 2);

        for (const location of emitterLocations) {
            try {
                const block = player.dimension.getBlock(location);
                if (block && block.typeId === emitterBlockId) {
                    // Check if any other player with lens is nearby
                    let shouldHide = true;
                    for (const otherPlayer of world.getAllPlayers()) {
                        if (otherPlayer.id === player.id) continue;
                        if (!this.playersWearingLens.has(otherPlayer.id)) continue;

                        const dx = otherPlayer.location.x - location.x;
                        const dy = otherPlayer.location.y - location.y;
                        const dz = otherPlayer.location.z - location.z;
                        const distSq = dx * dx + dy * dy + dz * dz;

                        if (distSq <= revealRadius * revealRadius) {
                            shouldHide = false;
                            break;
                        }
                    }

                    if (shouldHide) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const permutation = block.permutation.withState("ns_ptl:visible" as any, false);
                        block.setPermutation(permutation);
                    }
                }
            } catch {
                // Block may be in unloaded chunk
            }
        }
    }

    // Also reveal emitters when player holds tuner wand in hand
    static initTunerWandReveal() {
        const tunerWandId = "ns_ptl:tuner_wand";
        const playersHoldingTuner: Set<string> = new Set();

        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                try {
                    const equipment = player.getComponent("minecraft:equippable");
                    if (!equipment) continue;

                    const mainhand = equipment.getEquipment(EquipmentSlot.Mainhand);
                    const isHoldingTuner = mainhand?.typeId === tunerWandId;
                    const wasHoldingTuner = playersHoldingTuner.has(player.id);

                    if (isHoldingTuner && !wasHoldingTuner) {
                        playersHoldingTuner.add(player.id);
                    } else if (isHoldingTuner) {
                        // Still holding, reveal emitters
                        this.revealEmittersForPlayer(player);
                    } else if (!isHoldingTuner && wasHoldingTuner) {
                        playersHoldingTuner.delete(player.id);
                        // Only hide if not wearing lens
                        if (!this.playersWearingLens.has(player.id)) {
                            this.hideEmittersForPlayer(player);
                        }
                    }
                } catch {
                    // Player may be invalid
                }
            }
        }, checkInterval);
    }
}
