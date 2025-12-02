import { Block, Player, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { ColorPresets, DefaultEmitterConfig, EmissionShape, EmitterConfig, getConfigKey, TexturePresets } from "./EmitterConfig";

// ============================================================================
// Storage Functions
// ============================================================================

/** Read config from world dynamic property */
export function getEmitterConfig(block: Block): EmitterConfig {
    try {
        const key = getConfigKey(block.location.x, block.location.y, block.location.z, block.dimension.id);
        const data = world.getDynamicProperty(key) as string | undefined;
        if (data) {
            // Merge with defaults to ensure new fields have values for old configs
            return { ...DefaultEmitterConfig, ...JSON.parse(data) };
        }
    } catch {
        /* invalid */
    }
    return { ...DefaultEmitterConfig };
}

/** Write config to world dynamic property */
export function setEmitterConfig(block: Block, config: EmitterConfig) {
    const key = getConfigKey(block.location.x, block.location.y, block.location.z, block.dimension.id);
    world.setDynamicProperty(key, JSON.stringify(config));
}

// ============================================================================
// Clipboard for Copy/Paste
// ============================================================================

const playerClipboard = new Map<string, EmitterConfig>();

export function copyEmitterConfig(playerId: string, config: EmitterConfig) {
    playerClipboard.set(playerId, { ...config });
}

export function getClipboard(playerId: string): EmitterConfig | undefined {
    return playerClipboard.get(playerId);
}

// ============================================================================
// Particle Composer UI
// ============================================================================

export default class TunerUI {
    /**
     * Main entry point - opens the Particle Composer
     */
    static async openComposer(player: Player, block: Block) {
        const config = getEmitterConfig(block);

        const form = new ActionFormData()
            .title("§l§dParticle Composer")
            .body(this.getStatusSummary(config))
            .button("§6Appearance\n§rStyle, Color, Size")
            .button("§3Physics & Motion\n§rSpeed, Gravity, Direction")
            .button("§2Spawning Rules\n§rRate, Lifetime, Shape")
            .button("§5Advanced\n§rSpin, Pulse, Billboard")
            .button(config.enabled ? "§cDisable Emitter" : "§2Enable Emitter")
            .button("§eCopy Settings")
            .button("§ePaste Settings")
            .button("§4Reset to Default");

        const response = await form.show(player);
        if (response.canceled || response.cancelationReason === FormCancelationReason.UserBusy) return;

        switch (response.selection) {
            case 0:
                await this.openAppearanceTab(player, block, config);
                break;
            case 1:
                await this.openPhysicsTab(player, block, config);
                break;
            case 2:
                await this.openSpawningTab(player, block, config);
                break;
            case 3:
                await this.openAdvancedTab(player, block, config);
                break;
            case 4:
                config.enabled = !config.enabled;
                setEmitterConfig(block, config);
                player.sendMessage(config.enabled ? "§aEmitter enabled!" : "§cEmitter disabled.");
                system.run(() => this.openComposer(player, block));
                break;
            case 5:
                copyEmitterConfig(player.id, config);
                player.sendMessage("§eSettings copied to clipboard!");
                system.run(() => this.openComposer(player, block));
                break;
            case 6: {
                const clipboard = getClipboard(player.id);
                if (clipboard) {
                    setEmitterConfig(block, { ...clipboard });
                    player.sendMessage("§aSettings pasted from clipboard!");
                } else {
                    player.sendMessage("§cNo settings in clipboard. Copy first!");
                }
                system.run(() => this.openComposer(player, block));
                break;
            }
            case 7:
                setEmitterConfig(block, { ...DefaultEmitterConfig });
                player.sendMessage("§eReset to default settings.");
                system.run(() => this.openComposer(player, block));
                break;
        }
    }

    /**
     * Quick copy/paste via sneak+interact
     */
    static async handleSneakInteract(player: Player, block: Block) {
        const config = getEmitterConfig(block);
        const clipboard = getClipboard(player.id);

        const form = new ActionFormData()
            .title("§l§eQuick Actions")
            .body(clipboard ? "§aClipboard has settings" : "§8Clipboard is empty")
            .button("§eCopy Settings")
            .button("§ePaste Settings")
            .button("Cancel");

        const response = await form.show(player);
        if (response.canceled) return;

        switch (response.selection) {
            case 0:
                copyEmitterConfig(player.id, config);
                player.sendMessage("§eSettings copied!");
                break;
            case 1:
                if (clipboard) {
                    setEmitterConfig(block, { ...clipboard });
                    player.sendMessage("§aSettings pasted!");
                } else {
                    player.sendMessage("§cNo settings to paste!");
                }
                break;
        }
    }

    // ========================================================================
    // Status Summary
    // ========================================================================

    private static getStatusSummary(config: EmitterConfig): string {
        const texture = TexturePresets[config.textureId] || "Unknown";
        const startColor = ColorPresets[config.colorStartIndex]?.[0] || "White";
        const endColor = ColorPresets[config.colorEndIndex]?.[0] || "White";
        const colorText = config.colorStartIndex === config.colorEndIndex ? startColor : `${startColor} → ${endColor}`;
        const blend = config.blendMode === "add" ? "Additive (Glow)" : "Normal";
        const dir =
            config.directionMode === "radial"
                ? "Radial"
                : `(${config.vectorX.toFixed(1)}, ${config.vectorY.toFixed(1)}, ${config.vectorZ.toFixed(1)})`;

        return [
            `§l§6Texture:§r ${texture}`,
            `§l§6Color:§r ${colorText} | α=${(config.alpha * 100).toFixed(0)}%`,
            `§l§6Blend:§r ${blend}`,
            `§l§6Size:§r ${config.sizeStart.toFixed(1)} → ${config.sizeEnd.toFixed(1)}`,
            `§l§3Speed:§r ${config.speed.toFixed(1)} | Gravity: ${config.gravity.toFixed(1)}`,
            `§l§3Direction:§r ${dir}`,
            `§l§2Rate:§r ${config.spawnRate}/s | Life: ${config.lifetime.toFixed(1)}s`,
            `§l§2Shape:§r ${config.shape} (r=${config.emissionRadius.toFixed(1)})`,
            `§l§5Status:§r ${config.enabled ? "§2Active" : "§cDisabled"}`,
        ].join("\n");
    }

    // ========================================================================
    // Tab A: Appearance
    // ========================================================================

    private static async openAppearanceTab(player: Player, block: Block, config: EmitterConfig) {
        const currentTexture = TexturePresets[config.textureId] || "Unknown";
        const startColor = ColorPresets[config.colorStartIndex]?.[0] || "White";
        const endColor = ColorPresets[config.colorEndIndex]?.[0] || "White";
        const colorText = config.colorStartIndex === config.colorEndIndex ? startColor : `${startColor} → ${endColor}`;

        const form = new ActionFormData()
            .title("§l§6Appearance")
            .body(
                `§lTexture:§r ${currentTexture}\n` +
                    `§lColor:§r ${colorText}\n` +
                    `§lSize:§r ${config.sizeStart.toFixed(1)} → ${config.sizeEnd.toFixed(1)}`
            )
            .button("§6Select Texture\n§rChoose particle shape", `textures/particle/icons/texture_${config.textureId}.png`)
            .button("§dColor / Gradient\n§rTint start and end colors")
            .button("§eSize Settings\n§rStart/End size")
            .button("§5Blend & Opacity\n§rGlow effects, transparency")
            .button("Back to Main Menu");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        switch (response.selection) {
            case 0:
                await this.openTextureSelector(player, block, config);
                break;
            case 1:
                await this.openColorGradientSettings(player, block, config);
                break;
            case 2:
                await this.openSizeSettings(player, block, config);
                break;
            case 3:
                await this.openBlendSettings(player, block, config);
                break;
            case 4:
                system.run(() => this.openComposer(player, block));
                break;
        }
    }

    // ========================================================================
    // Texture Selector (with icons)
    // ========================================================================

    private static async openTextureSelector(player: Player, block: Block, config: EmitterConfig) {
        const currentTexture = TexturePresets[config.textureId] || "Unknown";

        const form = new ActionFormData().title("§l§6Select Texture").body(`Current: ${currentTexture}`);

        // Add all textures (0-15)
        for (let i = 0; i < TexturePresets.length; i++) {
            const selected = i === config.textureId ? " §2✓" : "";
            form.button(`${TexturePresets[i]}${selected}`, `textures/particle/icons/texture_${i}.png`);
        }

        form.button("Back");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        if (response.selection !== undefined && response.selection < TexturePresets.length) {
            config.textureId = response.selection;
            setEmitterConfig(block, config);
            player.sendMessage(`§6Texture set to: ${TexturePresets[response.selection]}`);
            system.run(() => this.openTextureSelector(player, block, config));
        } else {
            system.run(() => this.openAppearanceTab(player, block, config));
        }
    }

    // ========================================================================
    // Color / Gradient Settings
    // ========================================================================

    private static async openColorGradientSettings(player: Player, block: Block, config: EmitterConfig) {
        const colorNames = ColorPresets.map((c) => c[0]);

        const form = new ModalFormData()
            .title("§l§dColor / Gradient")
            .dropdown("Start Color (spawn)", colorNames, {
                defaultValueIndex: config.colorStartIndex,
            })
            .dropdown("End Color (fade to)", colorNames, {
                defaultValueIndex: config.colorEndIndex,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        const [startIdx, endIdx] = response.formValues as [number, number];

        config.colorStartIndex = startIdx;
        config.colorEndIndex = endIdx;

        // Update legacy RGB fields from start color for compatibility
        const startPreset = ColorPresets[startIdx];
        if (startPreset) {
            config.colorR = startPreset[1];
            config.colorG = startPreset[2];
            config.colorB = startPreset[3];
            config.tintMode = startIdx !== 0; // Enable tint if not "None"
        }

        setEmitterConfig(block, config);

        const startName = ColorPresets[startIdx]?.[0] || "White";
        const endName = ColorPresets[endIdx]?.[0] || "White";
        if (startIdx === endIdx) {
            player.sendMessage(`§dColor set to: ${startName}`);
        } else {
            player.sendMessage(`§dGradient set: ${startName} → ${endName}`);
        }
        system.run(() => this.openAppearanceTab(player, block, config));
    }

    // ========================================================================
    // Blend & Opacity Settings
    // ========================================================================

    private static async openBlendSettings(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§5Blend & Opacity")
            .slider("Opacity %", 10, 100, { defaultValue: Math.round(config.alpha * 100), valueStep: 5 })
            .dropdown("Blending Mode", ["Normal (Alpha)", "Additive (Glow)"], {
                defaultValueIndex: config.blendMode === "add" ? 1 : 0,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        const [alpha, blendIdx] = response.formValues as [number, number];

        config.alpha = alpha / 100;
        config.blendMode = blendIdx === 0 ? "blend" : "add";

        setEmitterConfig(block, config);
        player.sendMessage("§5Blend settings saved!");
        system.run(() => this.openAppearanceTab(player, block, config));
    }

    // ========================================================================
    // Size Settings
    // ========================================================================

    private static async openSizeSettings(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§6Size Settings")
            .slider("Size: Start", 1, 50, { defaultValue: Math.round(config.sizeStart * 10), valueStep: 1 })
            .slider("Size: End", 0, 50, { defaultValue: Math.round(config.sizeEnd * 10), valueStep: 1 });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        const [sizeStart, sizeEnd] = response.formValues as [number, number];

        config.sizeStart = sizeStart / 10;
        config.sizeEnd = sizeEnd / 10;

        setEmitterConfig(block, config);
        player.sendMessage("§6Size settings saved!");
        system.run(() => this.openAppearanceTab(player, block, config));
    }

    // ========================================================================
    // Tab B: Physics & Motion
    // ========================================================================

    private static async openPhysicsTab(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§bPhysics & Motion")
            .slider("Speed (x10)", 0, 20, { defaultValue: Math.round(config.speed * 10), valueStep: 1 })
            .slider("Gravity (x10, -20=float, +20=fall)", -20, 20, { defaultValue: Math.round(config.gravity * 10), valueStep: 1 })
            .slider("Drag (x10)", 0, 100, { defaultValue: Math.round(config.drag * 10), valueStep: 5 })
            .dropdown("Direction Mode", ["Vector (Specific direction)", "Radial (Explosion)"], {
                defaultValueIndex: config.directionMode === "radial" ? 1 : 0,
            })
            .slider("Vector X (x10)", -10, 10, { defaultValue: Math.round(config.vectorX * 10), valueStep: 1 })
            .slider("Vector Y (x10)", -10, 10, { defaultValue: Math.round(config.vectorY * 10), valueStep: 1 })
            .slider("Vector Z (x10)", -10, 10, { defaultValue: Math.round(config.vectorZ * 10), valueStep: 1 })
            .toggle("Collision (bounce/die on blocks)", { defaultValue: config.collision });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        const [speed, gravity, drag, dirIdx, vectorX, vectorY, vectorZ, collision] = response.formValues as [
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            boolean,
        ];

        config.speed = speed / 10;
        config.gravity = gravity / 10;
        config.drag = drag / 10;
        config.directionMode = dirIdx === 0 ? "vector" : "radial";
        config.vectorX = vectorX / 10;
        config.vectorY = vectorY / 10;
        config.vectorZ = vectorZ / 10;
        config.collision = collision;

        setEmitterConfig(block, config);
        player.sendMessage("§bPhysics settings saved!");
        system.run(() => this.openComposer(player, block));
    }

    // ========================================================================
    // Tab C: Spawning Rules
    // ========================================================================

    private static async openSpawningTab(player: Player, block: Block, config: EmitterConfig) {
        const offsetText =
            config.offsetX === 0 && config.offsetY === 0 && config.offsetZ === 0
                ? "Centered"
                : `(${config.offsetX.toFixed(1)}, ${config.offsetY.toFixed(1)}, ${config.offsetZ.toFixed(1)})`;

        const form = new ActionFormData()
            .title("§l§2Spawning Rules")
            .body(
                `§lRate:§r ${config.spawnRate}/s | Life: ${config.lifetime.toFixed(1)}s\n` +
                    `§lShape:§r ${config.shape} (r=${config.emissionRadius.toFixed(1)})\n` +
                    `§lOffset:§r ${offsetText}`
            )
            .button("§2Rate & Lifetime\n§rParticles per second")
            .button("§2Shape & Radius\n§rEmission area")
            .button("§2Position Offset\n§rXYZ spawn offset")
            .button("Back to Main Menu");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        switch (response.selection) {
            case 0:
                await this.openSpawningRateSettings(player, block, config);
                break;
            case 1:
                await this.openSpawningShapeSettings(player, block, config);
                break;
            case 2:
                await this.openSpawningOffsetSettings(player, block, config);
                break;
            case 3:
                system.run(() => this.openComposer(player, block));
                break;
        }
    }

    private static async openSpawningRateSettings(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§2Rate & Lifetime")
            .slider("Spawn Rate (particles/second)", 1, 50, {
                defaultValue: config.spawnRate,
                valueStep: 1,
            })
            .slider("Particle Lifetime (x2 seconds)", 1, 20, {
                defaultValue: Math.round(config.lifetime * 2),
                valueStep: 1,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openSpawningTab(player, block, config));
            return;
        }

        const [spawnRate, lifetime] = response.formValues as [number, number];

        config.spawnRate = spawnRate;
        config.lifetime = lifetime / 2;

        setEmitterConfig(block, config);
        player.sendMessage("§2Rate settings saved!");
        system.run(() => this.openSpawningTab(player, block, config));
    }

    private static async openSpawningShapeSettings(player: Player, block: Block, config: EmitterConfig) {
        const shapeOptions: EmissionShape[] = ["sphere", "box", "disc"];
        const shapeLabels = ["Sphere", "Box", "Disc"];

        const form = new ModalFormData()
            .title("§l§2Shape & Radius")
            .slider("Emission Radius (x4)", 0, 20, {
                defaultValue: Math.round(config.emissionRadius * 4),
                valueStep: 1,
            })
            .dropdown("Emission Shape", shapeLabels, {
                defaultValueIndex: shapeOptions.indexOf(config.shape),
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openSpawningTab(player, block, config));
            return;
        }

        const [emissionRadius, shapeIdx] = response.formValues as [number, number];

        config.emissionRadius = emissionRadius / 4;
        config.shape = shapeOptions[shapeIdx];

        setEmitterConfig(block, config);
        player.sendMessage("§2Shape settings saved!");
        system.run(() => this.openSpawningTab(player, block, config));
    }

    private static async openSpawningOffsetSettings(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§2Position Offset")
            .slider("Offset X (x10)", -20, 20, {
                defaultValue: Math.round(config.offsetX * 10),
                valueStep: 1,
            })
            .slider("Offset Y (x10)", -20, 20, {
                defaultValue: Math.round(config.offsetY * 10),
                valueStep: 1,
            })
            .slider("Offset Z (x10)", -20, 20, {
                defaultValue: Math.round(config.offsetZ * 10),
                valueStep: 1,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openSpawningTab(player, block, config));
            return;
        }

        const [offsetX, offsetY, offsetZ] = response.formValues as [number, number, number];

        config.offsetX = offsetX / 10;
        config.offsetY = offsetY / 10;
        config.offsetZ = offsetZ / 10;

        setEmitterConfig(block, config);
        player.sendMessage("§2Offset settings saved!");
        system.run(() => this.openSpawningTab(player, block, config));
    }

    // ========================================================================
    // Tab D: Advanced
    // ========================================================================

    private static async openAdvancedTab(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§5Advanced")
            .slider("Spin Speed (rotation)", -360, 360, {
                defaultValue: config.spinSpeed,
                valueStep: 15,
            })
            .toggle("Face Camera (Billboard)", { defaultValue: config.faceCamera })
            .toggle("Pulse (Breathing effect)", { defaultValue: config.pulse });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        const [spinSpeed, faceCamera, pulse] = response.formValues as [number, boolean, boolean];

        config.spinSpeed = spinSpeed;
        config.faceCamera = faceCamera;
        config.pulse = pulse;

        setEmitterConfig(block, config);
        player.sendMessage("§5Advanced settings saved!");
        system.run(() => this.openComposer(player, block));
    }
}
