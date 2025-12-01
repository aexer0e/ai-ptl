import { EquipmentSlot, MolangVariableMap, Player, system, world } from "@minecraft/server";
import { DirectionType, ParticleTypesMap } from "Atmosphere/ParticleTypes";
import TunerUI from "Atmosphere/TunerUI";

const tunerWandId = "ns_ptl:tuner_wand";
const aetherLensId = "ns_ptl:aether_lens";
let molangVars: MolangVariableMap | null = null;

// Track recently placed blocks that should be visible temporarily (tick when visibility expires)
const recentlyPlaced = new Map<string, number>();
const placementVisibleTicks = 60; // ~3 seconds at 20 tps

function locationKey(x: number, y: number, z: number, dimId: string) {
    return `${dimId}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

interface EmitterConfig {
    particleTypeId: string;
    density: number;
    spread: number;
    direction: DirectionType;
    requiresRedstone: boolean;
    enabled: boolean;
}

const DefaultConfig: EmitterConfig = {
    particleTypeId: "rising_steam",
    density: 5,
    spread: 2,
    direction: "up",
    requiresRedstone: false,
    enabled: true,
};

function configKey(x: number, y: number, z: number, dimId: string) {
    return `emitter:${dimId}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

function getConfig(x: number, y: number, z: number, dimId: string): EmitterConfig {
    try {
        const data = world.getDynamicProperty(configKey(x, y, z, dimId)) as string | undefined;
        if (data) return JSON.parse(data);
    } catch {
        /* invalid */
    }
    return { ...DefaultConfig };
}

system.beforeEvents.startup.subscribe(({ itemComponentRegistry, blockComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent("ns_ptl:aether_lens", {});
    itemComponentRegistry.registerCustomComponent("ns_ptl:tuner_wand", {});

    blockComponentRegistry.registerCustomComponent("ns_ptl:emitter_block", {
        onPlace: (event) => {
            const { block, dimension } = event;
            const key = locationKey(block.location.x, block.location.y, block.location.z, dimension.id);
            recentlyPlaced.set(key, system.currentTick + placementVisibleTicks);
            // Set visible immediately on place
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            block.setPermutation(block.permutation.withState("ns_ptl:visible" as any, true));
        },

        onTick: (event) => {
            const { block, dimension } = event;
            const { x, y, z } = block.location;
            const config = getConfig(x, y, z, dimension.id);
            const key = locationKey(x, y, z, dimension.id);

            // Check if recently placed (temporary visibility)
            const expiresAt = recentlyPlaced.get(key);
            if (expiresAt !== undefined && system.currentTick >= expiresAt) {
                recentlyPlaced.delete(key);
            }
            const isRecentlyPlaced = recentlyPlaced.has(key);

            // Update visibility based on nearby players with lens/wand OR recently placed
            let shouldBeVisible = isRecentlyPlaced;
            if (!shouldBeVisible) {
                for (const player of world.getAllPlayers()) {
                    if (player.dimension.id !== dimension.id) continue;
                    const dx = player.location.x - x;
                    const dy = player.location.y - y;
                    const dz = player.location.z - z;
                    if (dx * dx + dy * dy + dz * dz > 400) continue; // 20 block radius

                    const equip = player.getComponent("minecraft:equippable");
                    if (!equip) continue;
                    const helmet = equip.getEquipment(EquipmentSlot.Head);
                    const mainhand = equip.getEquipment(EquipmentSlot.Mainhand);
                    if (helmet?.typeId === aetherLensId || mainhand?.typeId === tunerWandId) {
                        shouldBeVisible = true;
                        break;
                    }
                }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentVisible = block.permutation.getState("ns_ptl:visible" as any) as boolean;
            if (currentVisible !== shouldBeVisible) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                block.setPermutation(block.permutation.withState("ns_ptl:visible" as any, shouldBeVisible));
            }

            // Spawn particles if enabled
            if (!config.enabled) return;
            if (config.requiresRedstone && !block.getRedstonePower()) return;

            const particle = ParticleTypesMap.get(config.particleTypeId);
            if (!particle) return;

            if (!molangVars) molangVars = new MolangVariableMap();
            // Density: 1-10 maps to multiplier for spawn rate
            molangVars.setFloat("emitter_density", config.density);
            // Spread: 0-4 maps to 0.5-2.5 blocks emission radius (0.5 base + 0.5 per level)
            molangVars.setFloat("emitter_spread", 0.5 + config.spread * 0.5);
            // Direction: 0=down, 1=up, 2=omni (particles can use this)
            const dirValue = config.direction === "down" ? 0 : config.direction === "up" ? 1 : 2;
            molangVars.setFloat("emitter_direction", dirValue);

            const spawnY = config.direction === "down" ? y : config.direction === "up" ? y + 1 : y + 0.5;
            try {
                dimension.spawnParticle(particle.particleId, { x: x + 0.5, y: spawnY, z: z + 0.5 }, molangVars);
            } catch {
                /* unloaded */
            }
        },

        onPlayerInteract: (event) => {
            const player = event.player;
            if (!(player instanceof Player)) return;

            const equipment = player.getComponent("minecraft:equippable");
            if (!equipment) return;

            const mainhand = equipment.getEquipment(EquipmentSlot.Mainhand);
            if (!mainhand || mainhand.typeId !== tunerWandId) {
                player.sendMessage("§7Use a Tuner Wand to configure this emitter.");
                return;
            }

            system.run(() => TunerUI.openTunerMenu(player, event.block));
        },
    });
});
