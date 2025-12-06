import { Block, Player, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import {
    DirectionLabels,
    DirectionType,
    DirectionTypes,
    ParticleCategories,
    ParticleCategory,
    ParticleTypesMap,
    getParticlesByCategory,
} from "./ParticleTypes";

export interface EmitterConfig {
    particleTypeId: string;
    density: number;
    spread: number;
    direction: DirectionType;
    requiresRedstone: boolean;
    enabled: boolean;
}

export const DefaultEmitterConfig: EmitterConfig = {
    particleTypeId: "rising_steam",
    density: 5,
    spread: 2,
    direction: "up",
    requiresRedstone: false,
    enabled: true,
};

function configKey(block: Block): string {
    const { x, y, z } = block.location;
    return `emitter:${block.dimension.id}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

/** Read config from world dynamic property */
export function getEmitterConfig(block: Block): EmitterConfig {
    try {
        const data = world.getDynamicProperty(configKey(block)) as string | undefined;
        if (data) return JSON.parse(data);
    } catch {
        /* invalid */
    }
    return { ...DefaultEmitterConfig };
}

/** Write config to world dynamic property */
export function setEmitterConfig(block: Block, config: EmitterConfig) {
    world.setDynamicProperty(configKey(block), JSON.stringify(config));
}

export default class TunerUI {
    static async openTunerMenu(player: Player, block: Block) {
        const config = getEmitterConfig(block);

        const form = new ActionFormData()
            .title("§l§dDIY Particles Tuner")
            .body(this.getStatusText(config))
            .button("§2Select Effect Type")
            .button("§6Adjust Settings")
            .button("§3Toggle Mode\n§r" + (config.requiresRedstone ? "Redstone" : "Always On"))
            .button(config.enabled ? "§c⬛ Disable" : "§2⬜ Enable")
            .button("§4Reset");

        const response = await form.show(player);
        if (response.canceled || response.cancelationReason === FormCancelationReason.UserBusy) return;

        switch (response.selection) {
            case 0:
                await this.openEffectTypeMenu(player, block, config);
                break;
            case 1:
                await this.openSettingsMenu(player, block, config);
                break;
            case 2:
                config.requiresRedstone = !config.requiresRedstone;
                setEmitterConfig(block, config);
                player.sendMessage(config.requiresRedstone ? "§eRequires redstone." : "§aAlways active.");
                break;
            case 3:
                config.enabled = !config.enabled;
                setEmitterConfig(block, config);
                player.sendMessage(config.enabled ? "§aEnabled!" : "§cDisabled.");
                break;
            case 4:
                setEmitterConfig(block, { ...DefaultEmitterConfig });
                player.sendMessage("§eReset to defaults.");
                break;
        }
    }

    private static getStatusText(config: EmitterConfig): string {
        const particle = ParticleTypesMap.get(config.particleTypeId);
        const densityLabels = ["Minimal", "Sparse", "Light", "Low", "Medium", "Normal", "Dense", "Heavy", "Thick", "Maximum"];
        const spreadLabels = ["Focused", "Narrow", "Normal", "Wide", "Very Wide"];
        return [
            `Effect: ${particle?.name ?? "Unknown"}`,
            `Density: ${densityLabels[config.density - 1] ?? "Normal"} (${config.density}/10)`,
            `Spread: ${spreadLabels[config.spread] ?? "Normal"} (${config.spread}/4)`,
            `Direction: ${DirectionLabels[config.direction]}`,
            `Mode: ${config.requiresRedstone ? "Redstone" : "Always On"}`,
            `Status: ${config.enabled ? "§aActive" : "§cDisabled"}`,
        ].join("\n");
    }

    private static async openEffectTypeMenu(player: Player, block: Block, config: EmitterConfig) {
        const categories = Object.keys(ParticleCategories) as ParticleCategory[];
        const form = new ActionFormData().title("§l§dSelect Category");

        for (const cat of categories) {
            form.button(`${ParticleCategories[cat]}\n§r${getParticlesByCategory(cat).length} effects`);
        }
        form.button("§c← Back");

        const response = await form.show(player);
        if (response.canceled) return;
        if (response.selection === categories.length) {
            system.run(() => this.openTunerMenu(player, block));
            return;
        }

        await this.openEffectListMenu(player, block, config, categories[response.selection!]);
    }

    private static async openEffectListMenu(player: Player, block: Block, config: EmitterConfig, category: ParticleCategory) {
        const particles = getParticlesByCategory(category);
        const form = new ActionFormData().title(`§l§d${ParticleCategories[category]}`);

        for (const p of particles) {
            const sel = config.particleTypeId === p.id ? "§a✓ " : "";
            form.button(`${sel}§f${p.name}\n§r${p.description}`);
        }
        form.button("§c← Back");

        const response = await form.show(player);
        if (response.canceled) return;
        if (response.selection === particles.length) {
            await this.openEffectTypeMenu(player, block, config);
            return;
        }

        config.particleTypeId = particles[response.selection!].id;
        setEmitterConfig(block, config);
        player.sendMessage(`§aEffect: ${particles[response.selection!].name}`);
        system.run(() => this.openTunerMenu(player, block));
    }

    private static async openSettingsMenu(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§dSettings")
            .slider("Density (particle count)", 1, 10, { defaultValue: config.density, valueStep: 1 })
            .slider("Spread (emission area)", 0, 4, { defaultValue: config.spread, valueStep: 1 })
            .dropdown(
                "Direction",
                DirectionTypes.map((d) => DirectionLabels[d]),
                {
                    defaultValueIndex: DirectionTypes.indexOf(config.direction),
                }
            );

        const response = await form.show(player);
        if (response.canceled) return;

        const [density, spread, dirIdx] = response.formValues as [number, number, number];
        config.density = density;
        config.spread = spread;
        config.direction = DirectionTypes[dirIdx];
        setEmitterConfig(block, config);
        player.sendMessage(`§aSettings: Density=${density}, Spread=${spread}, Dir=${DirectionLabels[config.direction]}`);
        system.run(() => this.openTunerMenu(player, block));
    }
}
