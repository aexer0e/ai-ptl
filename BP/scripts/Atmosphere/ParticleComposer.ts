import { Block, Player, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { DefaultEmitterConfig, EmissionShape, EmitterConfig, getConfigKey, TexturePresets } from "./EmitterConfig";

// ============================================================================
// Storage Functions
// ============================================================================

/** Read config from world dynamic property */
export function getEmitterConfig(block: Block): EmitterConfig {
    try {
        const key = getConfigKey(block.location.x, block.location.y, block.location.z, block.dimension.id);
        const data = world.getDynamicProperty(key) as string | undefined;
        if (data) return JSON.parse(data);
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
            .button("§bPhysics & Motion\n§rSpeed, Gravity, Direction")
            .button("§aSpawning Rules\n§rRate, Lifetime, Shape")
            .button("§5Advanced\n§rSpin, Pulse, Billboard")
            .button(config.enabled ? "§cDisable Emitter" : "§aEnable Emitter")
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
            .body(clipboard ? "§aClipboard has settings" : "§7Clipboard is empty")
            .button("§eCopy Settings")
            .button("§ePaste Settings")
            .button("§7Cancel");

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
        const style = config.renderStyle === "basic" ? "Basic Color" : `Preset: ${TexturePresets[config.textureId]}`;
        const color =
            config.renderStyle === "basic" || config.tintMode
                ? `RGB(${(config.colorR * 255).toFixed(0)}, ${(config.colorG * 255).toFixed(0)}, ${(config.colorB * 255).toFixed(0)})`
                : "Original";
        const blend = config.blendMode === "add" ? "Additive (Glow)" : "Normal";
        const dir =
            config.directionMode === "radial"
                ? "Radial"
                : `(${config.vectorX.toFixed(1)}, ${config.vectorY.toFixed(1)}, ${config.vectorZ.toFixed(1)})`;

        return [
            `§l§6Style:§r ${style}`,
            `§l§6Color:§r ${color} | α=${(config.alpha * 100).toFixed(0)}%`,
            `§l§6Blend:§r ${blend}`,
            `§l§6Size:§r ${config.sizeStart.toFixed(1)} → ${config.sizeEnd.toFixed(1)}`,
            `§l§bSpeed:§r ${config.speed.toFixed(1)} | Gravity: ${config.gravity.toFixed(1)}`,
            `§l§bDirection:§r ${dir}`,
            `§l§aRate:§r ${config.spawnRate}/s | Life: ${config.lifetime.toFixed(1)}s`,
            `§l§aShape:§r ${config.shape} (r=${config.emissionRadius.toFixed(1)})`,
            `§l§5Status:§r ${config.enabled ? "§aActive" : "§cDisabled"}`,
        ].join("\n");
    }

    // ========================================================================
    // Tab A: Appearance
    // ========================================================================

    private static async openAppearanceTab(player: Player, block: Block, config: EmitterConfig) {
        const currentTexture = TexturePresets[config.textureId] || "Unknown";

        const form = new ActionFormData()
            .title("§l§6Appearance")
            .body(
                `Current: ${config.renderStyle === "basic" ? "Basic Color" : `Preset: ${currentTexture}`}\n` +
                    `Color: RGB(${Math.round(config.colorR * 100)}%, ${Math.round(config.colorG * 100)}%, ${Math.round(config.colorB * 100)}%)\n` +
                    `Size: ${config.sizeStart.toFixed(1)} -> ${config.sizeEnd.toFixed(1)}`
            )
            .button("Select Texture\n§7Choose particle shape", "textures/particle/icons/texture_" + config.textureId + ".png")
            .button("Color Settings\n§7RGB, Alpha, Blend")
            .button("Size Settings\n§7Start/End size")
            .button("§7Back to Main Menu");

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
                await this.openColorSettings(player, block, config);
                break;
            case 2:
                await this.openSizeSettings(player, block, config);
                break;
            case 3:
                system.run(() => this.openComposer(player, block));
                break;
        }
    }

    // ========================================================================
    // Texture Selector (with icons)
    // ========================================================================

    private static async openTextureSelector(player: Player, block: Block, config: EmitterConfig) {
        const form = new ActionFormData().title("§l§6Select Texture").body(`Current: ${TexturePresets[config.textureId]}`);

        // Add each texture as a button with its icon
        for (let i = 0; i < TexturePresets.length; i++) {
            const selected = i === config.textureId ? " §a[Selected]" : "";
            form.button(`${TexturePresets[i]}${selected}`, `textures/particle/icons/texture_${i}.png`);
        }

        form.button("§7Back");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        if (response.selection !== undefined && response.selection < TexturePresets.length) {
            config.textureId = response.selection;
            config.renderStyle = response.selection === 0 ? "basic" : "preset";
            setEmitterConfig(block, config);
            player.sendMessage(`§6Texture set to: ${TexturePresets[response.selection]}`);
        }

        system.run(() => this.openAppearanceTab(player, block, config));
    }

    // ========================================================================
    // Color Settings
    // ========================================================================

    private static async openColorSettings(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§6Color Settings")
            .toggle("Tint Preset with RGB", { defaultValue: config.tintMode })
            .slider("Color: Red %", 0, 100, { defaultValue: Math.round(config.colorR * 100), valueStep: 5 })
            .slider("Color: Green %", 0, 100, { defaultValue: Math.round(config.colorG * 100), valueStep: 5 })
            .slider("Color: Blue %", 0, 100, { defaultValue: Math.round(config.colorB * 100), valueStep: 5 })
            .slider("Alpha / Opacity %", 10, 100, { defaultValue: Math.round(config.alpha * 100), valueStep: 5 })
            .dropdown("Blending Mode", ["Normal (Alpha)", "Additive (Glow)"], {
                defaultValueIndex: config.blendMode === "add" ? 1 : 0,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        const [tintMode, colorR, colorG, colorB, alpha, blendIdx] = response.formValues as [
            boolean,
            number,
            number,
            number,
            number,
            number,
        ];

        config.tintMode = tintMode;
        config.colorR = colorR / 100;
        config.colorG = colorG / 100;
        config.colorB = colorB / 100;
        config.alpha = alpha / 100;
        config.blendMode = blendIdx === 0 ? "blend" : "add";

        setEmitterConfig(block, config);
        player.sendMessage("§6Color settings saved!");
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
        const shapeOptions: EmissionShape[] = ["sphere", "box", "disc"];
        const shapeLabels = ["Sphere", "Box", "Disc"];

        const form = new ModalFormData()
            .title("§l§aSpawning Rules")
            .slider("Spawn Rate (particles/second)", 1, 50, {
                defaultValue: config.spawnRate,
                valueStep: 1,
            })
            .slider("Particle Lifetime (x2 seconds)", 1, 20, {
                defaultValue: Math.round(config.lifetime * 2),
                valueStep: 1,
            })
            .slider("Emission Radius (x4)", 0, 20, {
                defaultValue: Math.round(config.emissionRadius * 4),
                valueStep: 1,
            })
            .dropdown("Emission Shape", shapeLabels, {
                defaultValueIndex: shapeOptions.indexOf(config.shape),
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        const [spawnRate, lifetime, emissionRadius, shapeIdx] = response.formValues as [number, number, number, number];

        config.spawnRate = spawnRate;
        config.lifetime = lifetime / 2;
        config.emissionRadius = emissionRadius / 4;
        config.shape = shapeOptions[shapeIdx];

        setEmitterConfig(block, config);
        player.sendMessage("§aSpawning settings saved!");
        system.run(() => this.openComposer(player, block));
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
