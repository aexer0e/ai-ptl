import { EquipmentSlot, MolangVariableMap, Player, system, world } from "@minecraft/server";
import { ColorPresets, DefaultEmitterConfig, EmitterConfig, getConfigKey } from "Atmosphere/EmitterConfig";
import TunerUI from "Atmosphere/ParticleComposer";

const tunerWandId = "ns_ptl:tuner_wand";
const aetherLensId = "ns_ptl:aether_lens";
let molangVars: MolangVariableMap | null = null;

// Track recently placed blocks that should be visible temporarily (tick when visibility expires)
const recentlyPlaced = new Map<string, number>();
const placementVisibleTicks = 60; // ~3 seconds at 20 tps

function locationKey(x: number, y: number, z: number, dimId: string) {
    return `${dimId}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

function getConfig(x: number, y: number, z: number, dimId: string): EmitterConfig {
    try {
        const data = world.getDynamicProperty(getConfigKey(x, y, z, dimId)) as string | undefined;
        if (data) {
            // Merge with defaults to ensure new fields have values for old configs
            return { ...DefaultEmitterConfig, ...JSON.parse(data) };
        }
    } catch {
        /* invalid */
    }
    return { ...DefaultEmitterConfig };
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
            // GDDv2: 32 block radius for Aether Lens
            let shouldBeVisible = isRecentlyPlaced;
            if (!shouldBeVisible) {
                for (const player of world.getAllPlayers()) {
                    if (player.dimension.id !== dimension.id) continue;
                    const dx = player.location.x - x;
                    const dy = player.location.y - y;
                    const dz = player.location.z - z;
                    if (dx * dx + dy * dy + dz * dz > 1024) continue; // 32 block radius (32^2 = 1024)

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

            // Create MolangVariableMap with all GDDv2 parameters
            if (!molangVars) molangVars = new MolangVariableMap();

            // === Tab A: Appearance ===
            molangVars.setFloat("texture_id", config.textureId);

            // Color gradient: Get start and end colors from presets
            const startColor = ColorPresets[config.colorStartIndex] ?? ColorPresets[0];
            const endColor = ColorPresets[config.colorEndIndex] ?? ColorPresets[0];

            // Pass start color (spawn color)
            molangVars.setFloat("color_r", startColor[1]);
            molangVars.setFloat("color_g", startColor[2]);
            molangVars.setFloat("color_b", startColor[3]);

            // Pass end color (fade-to color)
            molangVars.setFloat("color_end_r", endColor[1]);
            molangVars.setFloat("color_end_g", endColor[2]);
            molangVars.setFloat("color_end_b", endColor[3]);

            molangVars.setFloat("alpha", config.alpha);
            molangVars.setFloat("blend_mode", config.blendMode === "add" ? 1 : 0);
            molangVars.setFloat("size_start", config.sizeStart);
            molangVars.setFloat("size_end", config.sizeEnd);

            // === Tab B: Physics & Motion ===
            molangVars.setFloat("speed", config.speed);
            molangVars.setFloat("gravity", config.gravity);
            molangVars.setFloat("drag", config.drag);
            molangVars.setFloat("direction_mode", config.directionMode === "radial" ? 1 : 0);
            molangVars.setFloat("vector_x", config.vectorX);
            molangVars.setFloat("vector_y", config.vectorY);
            molangVars.setFloat("vector_z", config.vectorZ);
            molangVars.setFloat("collision", config.collision ? 1 : 0);

            // === Tab C: Spawning Rules ===
            molangVars.setFloat("spawn_rate", config.spawnRate);
            molangVars.setFloat("lifetime", config.lifetime);
            molangVars.setFloat("emission_radius", config.emissionRadius);
            // shape: 0 = sphere, 1 = box, 2 = disc
            molangVars.setFloat("shape", config.shape === "sphere" ? 0 : config.shape === "box" ? 1 : 2);

            // === Tab D: Advanced ===
            molangVars.setFloat("spin_speed", config.spinSpeed);
            molangVars.setFloat("face_camera", config.faceCamera ? 1 : 0);
            molangVars.setFloat("pulse", config.pulse ? 1 : 0);

            // Select particle based on blend mode
            const particleId = config.blendMode === "add" ? "ns_ptl:master_particle_glow" : "ns_ptl:master_particle";

            // Apply spawn offset
            const spawnX = x + 0.5 + (config.offsetX ?? 0);
            const spawnY = y + 0.5 + (config.offsetY ?? 0);
            const spawnZ = z + 0.5 + (config.offsetZ ?? 0);

            try {
                dimension.spawnParticle(particleId, { x: spawnX, y: spawnY, z: spawnZ }, molangVars);
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
                player.sendMessage("§eUse a Tuner Wand to configure this emitter.");
                return;
            }

            // GDDv2: Sneak + Right-Click for Copy/Paste quick actions
            if (player.isSneaking) {
                system.run(() => TunerUI.handleSneakInteract(player, event.block));
            } else {
                system.run(() => TunerUI.openComposer(player, event.block));
            }
        },
    });
});
