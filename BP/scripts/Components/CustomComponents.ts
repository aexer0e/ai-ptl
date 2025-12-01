import { EquipmentSlot, Player, system } from "@minecraft/server";
import TunerUI from "Atmosphere/TunerUI";

const tunerWandId = "ns_ptl:tuner_wand";

/**
 * Registers all custom components for items and blocks.
 * Must be called during script startup (before world initialization).
 */
system.beforeEvents.startup.subscribe(({ itemComponentRegistry, blockComponentRegistry }) => {
    // Item Components
    itemComponentRegistry.registerCustomComponent("ns_ptl:aether_lens", {});
    itemComponentRegistry.registerCustomComponent("ns_ptl:tuner_wand", {});

    // Block Components - Universal Emitter with interaction handler
    blockComponentRegistry.registerCustomComponent("ns_ptl:emitter_block", {
        onPlayerInteract: (event) => {
            const player = event.player;
            if (!(player instanceof Player)) return;

            // Check if player is holding tuner wand
            const equipment = player.getComponent("minecraft:equippable");
            if (!equipment) return;

            const mainhand = equipment.getEquipment(EquipmentSlot.Mainhand);
            if (!mainhand || mainhand.typeId !== tunerWandId) {
                player.sendMessage("§7Use a Tuner Wand to configure this emitter.");
                return;
            }

            // Open tuner UI - must be async but onPlayerInteract is sync
            // Use system.run to defer to next tick
            system.run(() => {
                TunerUI.openTunerMenu(player, event.block);
            });
        },
    });
});
