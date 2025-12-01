import { Block, Dimension, Player, Vector3 } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { DefaultEmitterConfig, EmitterConfig } from "./EmitterManager";
import {
    DirectionLabels,
    DirectionTypes,
    ParticleCategories,
    ParticleCategory,
    ParticleTypesMap,
    getParticlesByCategory,
} from "./ParticleTypes";

const emitterBlockId = "ns_ptl:universal_emitter";

export default class TunerUI {
    // Opens the main tuner menu when player uses tuner wand on an emitter block
    static async openTunerMenu(player: Player, block: Block) {
        if (block.typeId !== emitterBlockId) {
            player.sendMessage("§cYou must use the Tuner Wand on a Universal Emitter block!");
            return;
        }

        const location = block.location;
        const dimension = block.dimension;
        const config = EmitterManager.getEmitterConfigAt(location, dimension);

        const form = new ActionFormData()
            .title("§l§dAtmosphere+ Tuner")
            .body(this.getStatusText(config))
            .button("§2Select Effect Type\n§rChoose particle effect")
            .button("§6Adjust Settings\n§rDensity, Spread, Direction")
            .button("§3Toggle Activation Mode\n§rAlways On / Redstone")
            .button(config.enabled ? "§c⬛ Disable Emitter" : "§a⬜ Enable Emitter")
            .button("§4Reset to Default");

        const response = await form.show(player);

        if (response.canceled || response.cancelationReason === FormCancelationReason.UserBusy) {
            return;
        }

        switch (response.selection) {
            case 0:
                await this.openEffectTypeMenu(player, location, dimension, config);
                break;
            case 1:
                await this.openSettingsMenu(player, location, dimension, config);
                break;
            case 2:
                config.requiresRedstone = !config.requiresRedstone;
                EmitterManager.setEmitterConfigAt(location, dimension, config);
                player.sendMessage(
                    config.requiresRedstone ? "§eEmitter now requires redstone power to activate." : "§aEmitter is now always active."
                );
                break;
            case 3:
                config.enabled = !config.enabled;
                EmitterManager.setEmitterConfigAt(location, dimension, config);
                player.sendMessage(config.enabled ? "§aEmitter enabled!" : "§cEmitter disabled.");
                break;
            case 4:
                EmitterManager.setEmitterConfigAt(location, dimension, { ...DefaultEmitterConfig });
                player.sendMessage("§eEmitter reset to default settings.");
                break;
        }
    }

    private static getStatusText(config: EmitterConfig): string {
        const particleType = ParticleTypesMap.get(config.particleTypeId);
        const effectName = particleType ? particleType.name : "Unknown";
        const status = config.enabled ? "§aActive" : "§cDisabled";
        const mode = config.requiresRedstone ? "Redstone Required" : "Always On";

        return [
            "§lCurrent Configuration§r",
            "",
            `§rEffect: §f${effectName}`,
            `§rDensity: §f${config.density}/10`,
            `§rSpread: §f${config.spread} blocks`,
            `§rDirection: §f${DirectionLabels[config.direction]}`,
            `§rMode: §f${mode}`,
            `§rStatus: ${status}`,
        ].join("\n");
    }

    private static async openEffectTypeMenu(player: Player, location: Vector3, dimension: Dimension, config: EmitterConfig) {
        const categories = Object.keys(ParticleCategories) as ParticleCategory[];

        const form = new ActionFormData().title("§l§dSelect Effect Category");

        for (const category of categories) {
            const label = ParticleCategories[category];
            const count = getParticlesByCategory(category).length;
            form.button(`${label}\n§r${count} effects`);
        }

        form.button("§c← Back");

        const response = await form.show(player);

        if (response.canceled) return;

        if (response.selection === categories.length) {
            // Back button
            const block = dimension.getBlock(location);
            if (block) await this.openTunerMenu(player, block);
            return;
        }

        const selectedCategory = categories[response.selection!];
        await this.openEffectListMenu(player, location, dimension, config, selectedCategory);
    }

    private static async openEffectListMenu(
        player: Player,
        location: Vector3,
        dimension: Dimension,
        config: EmitterConfig,
        category: ParticleCategory
    ) {
        const particles = getParticlesByCategory(category);

        const form = new ActionFormData().title(`§l§d${ParticleCategories[category]}`);

        for (const particle of particles) {
            const selected = config.particleTypeId === particle.id ? "§a✓ " : "";
            form.button(`${selected}§f${particle.name}\n§r${particle.description}`);
        }

        form.button("§c← Back");

        const response = await form.show(player);

        if (response.canceled) return;

        if (response.selection === particles.length) {
            // Back button
            await this.openEffectTypeMenu(player, location, dimension, config);
            return;
        }

        const selectedParticle = particles[response.selection!];
        config.particleTypeId = selectedParticle.id;
        EmitterManager.setEmitterConfigAt(location, dimension, config);
        player.sendMessage(`§aEffect set to: §f${selectedParticle.name}`);

        // Return to main menu
        const block = dimension.getBlock(location);
        if (block) await this.openTunerMenu(player, block);
    }

    private static async openSettingsMenu(player: Player, location: Vector3, dimension: Dimension, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§dAdjust Settings")
            .slider("§rDensity\n§8How many particles spawn", 1, 10, { defaultValue: config.density, valueStep: 1 })
            .slider("§rSpread\n§8Area covered (0-3 blocks)", 0, 3, { defaultValue: config.spread, valueStep: 1 })
            .dropdown(
                "§rDirection\n§8Which way particles travel",
                DirectionTypes.map((d) => DirectionLabels[d]),
                { defaultValueIndex: DirectionTypes.indexOf(config.direction) }
            );

        const response = await form.show(player);

        if (response.canceled) return;

        const [density, spread, directionIndex] = response.formValues as [number, number, number];

        config.density = density;
        config.spread = spread;
        config.direction = DirectionTypes[directionIndex];

        EmitterManager.setEmitterConfigAt(location, dimension, config);
        player.sendMessage("§aSettings updated!");

        // Return to main menu
        const block = dimension.getBlock(location);
        if (block) await this.openTunerMenu(player, block);
    }

    // Initialize the tuner wand interaction
    static init() {
        // Interaction is now handled by the block's custom component (ns_ptl:emitter_block)
        // in Components/CustomComponents.ts via onPlayerInteract
        BroadcastUtil.debug("TunerUI initialized");
    }
}
