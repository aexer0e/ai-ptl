import { Block, Player, system, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import {
    BlendMode,
    ColorPresets,
    DefaultEmitterConfig,
    EmissionShape,
    EmitterConfig,
    getConfigKey,
    ParticlePresets,
    TextureDefaultColors,
    TexturePresets,
} from "./EmitterConfig";

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
// Saved Creations Storage (World Dynamic Properties)
// ============================================================================

interface SavedCreation {
    name: string;
    config: EmitterConfig;
}

const savedCreationsKey = "saved_creations";
const maxSavedCreations = 20;

/** Get all saved creations from world storage */
function getSavedCreations(): SavedCreation[] {
    try {
        const data = world.getDynamicProperty(savedCreationsKey) as string | undefined;
        if (data) {
            return JSON.parse(data);
        }
    } catch {
        /* invalid */
    }
    return [];
}

/** Save creations to world storage */
function setSavedCreations(creations: SavedCreation[]) {
    world.setDynamicProperty(savedCreationsKey, JSON.stringify(creations));
}

/** Add a new saved creation */
function addSavedCreation(name: string, config: EmitterConfig): boolean {
    const creations = getSavedCreations();
    if (creations.length >= maxSavedCreations) {
        return false;
    }
    creations.push({ name, config: { ...config } });
    setSavedCreations(creations);
    return true;
}

/** Delete a saved creation by index */
function deleteSavedCreation(index: number): boolean {
    const creations = getSavedCreations();
    if (index < 0 || index >= creations.length) {
        return false;
    }
    creations.splice(index, 1);
    setSavedCreations(creations);
    return true;
}

// ============================================================================
// Shareable Preset Codes (Compact Hex Format)
// ============================================================================

// Format: P2-XXYYZZ... where each XX is a hex byte (00-FF)
// Much more compact than base64 JSON and uses only simple characters

// Legacy base64 support for old codes
const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function decodeBase64(b64: string): string {
    const cleaned = b64.replace(/[\s=]/g, "");
    if (cleaned.length === 0) return "";
    const bytes: number[] = [];
    for (let i = 0; i < cleaned.length; i += 4) {
        const a = base64Chars.indexOf(cleaned[i] || "A");
        const b = base64Chars.indexOf(cleaned[i + 1] || "A");
        const c = base64Chars.indexOf(cleaned[i + 2] || "A");
        const d = base64Chars.indexOf(cleaned[i + 3] || "A");
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;
        const n = (a << 18) | (b << 12) | (c << 6) | d;
        bytes.push((n >> 16) & 255);
        if (i + 2 < cleaned.length) bytes.push((n >> 8) & 255);
        if (i + 3 < cleaned.length) bytes.push(n & 255);
    }
    let result = "";
    for (const byte of bytes) {
        if (byte === 0) break;
        result += String.fromCharCode(byte);
    }
    return result;
}

/** Clamp and scale a float to fit in 0-255 range */
function encodeFloat(value: number, min: number, max: number): number {
    const normalized = (value - min) / (max - min);
    return Math.round(Math.max(0, Math.min(255, normalized * 255)));
}

/** Decode a 0-255 value back to original float range */
function decodeFloat(encoded: number, min: number, max: number): number {
    return min + (encoded / 255) * (max - min);
}

/** Convert a number to 2-char hex */
function toHex2(n: number): string {
    return Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
}

/** Parse 2 hex chars to number, returns 0 on error */
function fromHex2(hex: string): number {
    const val = parseInt(hex, 16);
    return isNaN(val) ? 0 : val;
}

/** Export config to shareable compact hex code */
function exportToCode(config: EmitterConfig): string {
    // Pack all values into hex bytes
    // Each value is mapped to 0-255 range
    const bytes = [
        config.textureId & 0xff, // 0: texture 0-15
        config.colorStartIndex & 0xff, // 1: color start 0-31
        config.colorEndIndex & 0xff, // 2: color end 0-31
        encodeFloat(config.alpha, 0, 1), // 3: alpha 0-1
        config.blendMode === "alpha" ? 1 : config.blendMode === "add" ? 2 : 0, // 4: blend mode
        encodeFloat(config.sizeStart, 0, 5), // 5: size start
        encodeFloat(config.sizeEnd, 0, 5), // 6: size end
        encodeFloat(config.speed, 0, 5), // 7: speed
        encodeFloat(config.gravity, -5, 5), // 8: gravity (centered)
        encodeFloat(config.acceleration, -5, 5), // 9: acceleration
        encodeFloat(config.drag, 0, 10), // 10: drag
        config.directionMode === "radial" ? 1 : 0, // 11: direction mode
        encodeFloat(config.vectorX, -1, 1), // 12: vector X
        encodeFloat(config.vectorY, -1, 1), // 13: vector Y
        encodeFloat(config.vectorZ, -1, 1), // 14: vector Z
        (config.collision ? 1 : 0) |
            (1 << 1) | // faceCamera always true (removed from config)
            ((config.randomRotation ? 1 : 0) << 2) |
            ((config.fadeOut ? 1 : 0) << 3), // 15: flags
        encodeFloat(config.spinSpeed, -360, 360), // 16: spin speed
        Math.min(255, config.spawnRate), // 17: spawn rate
        encodeFloat(config.lifetime, 0, 30), // 18: lifetime
        encodeFloat(config.emissionRadius, 0, 5), // 19: emission radius
        config.shape === "sphere" ? 0 : config.shape === "box" ? 1 : 2, // 20: shape
        encodeFloat(config.offsetX, -5, 5), // 21: offset X
        encodeFloat(config.offsetY, -5, 5), // 22: offset Y
        encodeFloat(config.offsetZ, -5, 5), // 23: offset Z
        encodeFloat(config.initialRotation, 0, 360), // 24: initial rotation
        encodeFloat(config.rotationRange, 0, 360), // 25: rotation range
        encodeFloat(config.spinSpeedRange ?? 0, 0, 180), // 26: spin speed range
    ];

    return "P2-" + bytes.map(toHex2).join("");
}

/** Import config from shareable hex code */
function importFromCode(code: string): EmitterConfig | null {
    try {
        // Clean and normalize input - remove ALL whitespace and common artifacts
        let cleaned = code.replace(/\s+/g, "").replace(/^["'`[(]+|["'`\])]+$/g, "");

        // Handle case-insensitive prefix, find it anywhere in string
        const upperCleaned = cleaned.toUpperCase();

        // Try new format first (P2-)
        let prefixIndex = upperCleaned.indexOf("P2-");
        if (prefixIndex !== -1) {
            cleaned = cleaned.slice(prefixIndex + 3); // Skip "P2-"
            return importFromHexCode(cleaned);
        }

        // Fall back to legacy format (DIYP1:)
        prefixIndex = upperCleaned.indexOf("DIYP1:");
        if (prefixIndex !== -1) {
            cleaned = cleaned.slice(prefixIndex + 6); // Skip "DIYP1:"
            return importFromLegacyCode(cleaned);
        }

        return null;
    } catch {
        return null;
    }
}

/** Import from new hex format */
function importFromHexCode(hex: string): EmitterConfig | null {
    // Remove any non-hex characters
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");

    // Need at least 26 bytes (52 hex chars) - support older 26-byte and newer 27-byte codes
    if (cleanHex.length < 52) return null;

    // Parse bytes (up to 27 for new format)
    const bytes: number[] = [];
    for (let i = 0; i < cleanHex.length && bytes.length < 27; i += 2) {
        bytes.push(fromHex2(cleanHex.slice(i, i + 2)));
    }

    if (bytes.length < 26) return null;

    const shapeMap: EmissionShape[] = ["sphere", "box", "disc"];
    const blendMap: BlendMode[] = ["blend", "alpha", "add"];
    const flags = bytes[15];

    return {
        ...DefaultEmitterConfig,
        textureId: bytes[0],
        colorStartIndex: bytes[1],
        colorEndIndex: bytes[2],
        alpha: decodeFloat(bytes[3], 0, 1),
        blendMode: blendMap[bytes[4]] ?? "blend",
        sizeStart: decodeFloat(bytes[5], 0, 5),
        sizeEnd: decodeFloat(bytes[6], 0, 5),
        speed: decodeFloat(bytes[7], 0, 5),
        gravity: decodeFloat(bytes[8], -5, 5),
        acceleration: decodeFloat(bytes[9], -5, 5),
        drag: decodeFloat(bytes[10], 0, 10),
        directionMode: bytes[11] === 1 ? "radial" : "vector",
        vectorX: decodeFloat(bytes[12], -1, 1),
        vectorY: decodeFloat(bytes[13], -1, 1),
        vectorZ: decodeFloat(bytes[14], -1, 1),
        collision: (flags & 1) !== 0,
        randomRotation: (flags & 4) !== 0,
        fadeOut: (flags & 8) !== 0,
        spinSpeed: decodeFloat(bytes[16], -360, 360),
        spawnRate: bytes[17],
        lifetime: decodeFloat(bytes[18], 0, 30),
        emissionRadius: decodeFloat(bytes[19], 0, 5),
        shape: shapeMap[bytes[20]] ?? "sphere",
        offsetX: decodeFloat(bytes[21], -5, 5),
        offsetY: decodeFloat(bytes[22], -5, 5),
        offsetZ: decodeFloat(bytes[23], -5, 5),
        initialRotation: decodeFloat(bytes[24], 0, 360),
        rotationRange: decodeFloat(bytes[25], 0, 360),
        spinSpeedRange: bytes.length > 26 ? decodeFloat(bytes[26], 0, 180) : 0,
        enabled: true,
    };
}

/** Import from legacy base64 JSON format (DIYP1:) */
function importFromLegacyCode(b64: string): EmitterConfig | null {
    const json = decodeBase64(b64);
    if (!json || json.length === 0) return null;

    let minimal;
    try {
        minimal = JSON.parse(json);
    } catch {
        const jsonStart = json.indexOf("{");
        const jsonEnd = json.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;
        minimal = JSON.parse(json.slice(jsonStart, jsonEnd + 1));
    }

    const shapeMap: EmissionShape[] = ["sphere", "box", "disc"];
    const blendMap: BlendMode[] = ["blend", "alpha", "add"];
    return {
        ...DefaultEmitterConfig,
        textureId: minimal.t ?? 0,
        colorStartIndex: minimal.cs ?? 0,
        colorEndIndex: minimal.ce ?? 0,
        alpha: minimal.a ?? 1,
        blendMode: blendMap[minimal.bm] ?? "blend",
        sizeStart: minimal.ss ?? 1,
        sizeEnd: minimal.se ?? 0.5,
        speed: minimal.sp ?? 0.5,
        gravity: minimal.g ?? 0,
        acceleration: minimal.ac ?? 0,
        drag: minimal.d ?? 0,
        directionMode: minimal.dm === 1 ? "radial" : "vector",
        vectorX: minimal.vx ?? 0,
        vectorY: minimal.vy ?? 1,
        vectorZ: minimal.vz ?? 0,
        collision: minimal.c === 1,
        spinSpeed: minimal.sps ?? 0,
        spawnRate: minimal.sr ?? 5,
        lifetime: minimal.l ?? 3,
        emissionRadius: minimal.er ?? 0.5,
        shape: shapeMap[minimal.sh] ?? "sphere",
        offsetX: minimal.ox ?? 0,
        offsetY: minimal.oy ?? 0,
        offsetZ: minimal.oz ?? 0,
        randomRotation: minimal.rr !== 0,
        initialRotation: minimal.ir ?? 0,
        rotationRange: minimal.rrg ?? 180,
        enabled: true,
    };
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
        const savedCount = getSavedCreations().length;

        const form = new ActionFormData()
            .title("§l§dParticle Composer")
            .body(this.getStatusSummary(config))
            .button("§6Presets\n§rPre-made effects")
            .button(`§5Saved Creations\n§r${savedCount}/${maxSavedCreations} saved`)
            .button("§6Appearance\n§rStyle, Color, Size")
            .button("§3Physics & Motion\n§rSpeed, Gravity, Rotation")
            .button("§2Spawning Rules\n§rRate, Lifetime, Shape, Rotation")
            .button(config.enabled ? "§cDisable Emitter" : "§2Enable Emitter")
            .button("§6Copy Settings")
            .button("§6Paste Settings")
            .button("§4Reset to Default");

        const response = await form.show(player);
        if (response.canceled || response.cancelationReason === FormCancelationReason.UserBusy) return;

        switch (response.selection) {
            case 0:
                await this.openPresetsMenu(player, block, config);
                break;
            case 1:
                await this.openSavedCreationsMenu(player, block, config);
                break;
            case 2:
                await this.openAppearanceTab(player, block, config);
                break;
            case 3:
                await this.openPhysicsTab(player, block, config);
                break;
            case 4:
                await this.openSpawningTab(player, block, config);
                break;
            case 5:
                config.enabled = !config.enabled;
                setEmitterConfig(block, config);
                player.sendMessage(config.enabled ? "§aEmitter enabled!" : "§cEmitter disabled.");
                system.run(() => this.openComposer(player, block));
                break;
            case 6:
                copyEmitterConfig(player.id, config);
                player.sendMessage("§6Settings copied to clipboard!");
                system.run(() => this.openComposer(player, block));
                break;
            case 7: {
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
            case 8:
                setEmitterConfig(block, { ...DefaultEmitterConfig });
                player.sendMessage("§6Reset to default settings.");
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
    // Presets Menu
    // ========================================================================

    private static async openPresetsMenu(player: Player, block: Block, _config: EmitterConfig) {
        const form = new ActionFormData()
            .title("§l§6Effect Presets")
            .body("§8Select a pre-configured particle effect.\n§8These are ready-to-use starting points!");

        for (const preset of ParticlePresets) {
            form.button(`§${preset.color}${preset.name}\n§r§8${preset.description}`);
        }

        form.button("§c<- Back");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        // Back button is the last one
        if (response.selection === ParticlePresets.length) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        // Apply the selected preset
        const preset = ParticlePresets[response.selection!];
        const newConfig: EmitterConfig = {
            ...DefaultEmitterConfig,
            ...preset.config,
            enabled: true,
        };

        setEmitterConfig(block, newConfig);
        player.sendMessage(`§aApplied preset: §${preset.color}${preset.name}`);
        system.run(() => this.openComposer(player, block));
    }

    // ========================================================================
    // Saved Creations Menu
    // ========================================================================

    private static async openSavedCreationsMenu(player: Player, block: Block, config: EmitterConfig) {
        const creations = getSavedCreations();

        const form = new ActionFormData()
            .title("§l§5Saved Creations")
            .body(`§8Your saved particle effects.\n§8${creations.length}/${maxSavedCreations} slots used.`);

        form.button("§2Save Current\n§8Save this emitter's settings");
        form.button("§6Export Code\n§8Share settings online");
        form.button("§6Import Code\n§8Paste shared code");

        for (const creation of creations) {
            form.button(`§5${creation.name}\n§8Tap to load`);
        }

        form.button("§c<- Back");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        // Save Current button
        if (response.selection === 0) {
            await this.openSaveCreationForm(player, block, config);
            return;
        }

        // Export Code button
        if (response.selection === 1) {
            await this.openExportCodeForm(player, block, config);
            return;
        }

        // Import Code button
        if (response.selection === 2) {
            await this.openImportCodeForm(player, block);
            return;
        }

        // Back button is the last one (after 3 fixed buttons + creations)
        if (response.selection === creations.length + 3) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        // Load a saved creation (offset by 3 for the fixed buttons)
        const creationIndex = response.selection! - 3;
        await this.openCreationOptionsMenu(player, block, creations[creationIndex], creationIndex);
    }

    private static async openExportCodeForm(player: Player, block: Block, config: EmitterConfig) {
        const code = exportToCode(config);

        const form = new ModalFormData().title("§l§6Export Code").textField("Copy this code to share:", code, { defaultValue: code });

        await form.show(player);
        // Whether they submit or cancel, just go back to the menu
        system.run(() => this.openSavedCreationsMenu(player, block, config));
    }

    private static async openImportCodeForm(player: Player, block: Block) {
        const form = new ModalFormData().title("§l§6Import Code").textField("Paste share code:", "DIYP1:...");

        const response = await form.show(player);
        if (response.canceled) {
            const config = getEmitterConfig(block);
            system.run(() => this.openSavedCreationsMenu(player, block, config));
            return;
        }

        const code = (response.formValues?.[0] as string)?.trim() || "";
        const imported = importFromCode(code);

        if (imported) {
            setEmitterConfig(block, imported);
            player.sendMessage("§aSettings imported successfully!");
            system.run(() => this.openComposer(player, block));
        } else {
            player.sendMessage("§cInvalid code. Make sure to copy the entire code including 'DIYP1:'");
            const config = getEmitterConfig(block);
            system.run(() => this.openSavedCreationsMenu(player, block, config));
        }
    }

    private static async openSaveCreationForm(player: Player, block: Block, config: EmitterConfig) {
        const creations = getSavedCreations();

        if (creations.length >= maxSavedCreations) {
            player.sendMessage(`§cCannot save: Maximum of ${maxSavedCreations} creations reached.`);
            system.run(() => this.openSavedCreationsMenu(player, block, config));
            return;
        }

        const form = new ModalFormData().title("§l§2Save Creation").textField("Name your creation:", "My Particle Effect");

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openSavedCreationsMenu(player, block, config));
            return;
        }

        const name = (response.formValues?.[0] as string)?.trim() || "Unnamed";
        const success = addSavedCreation(name, config);

        if (success) {
            player.sendMessage(`§aSaved creation: §5${name}`);
        } else {
            player.sendMessage("§cFailed to save creation.");
        }

        system.run(() => this.openSavedCreationsMenu(player, block, config));
    }

    private static async openCreationOptionsMenu(player: Player, block: Block, creation: SavedCreation, index: number) {
        const form = new ActionFormData()
            .title(`§l§5${creation.name}`)
            .body("§8Choose an action for this saved creation.")
            .button("§2Load\n§8Apply to this emitter")
            .button("§4Delete\n§8Remove from saved")
            .button("§c<- Back");

        const response = await form.show(player);
        if (response.canceled) {
            const config = getEmitterConfig(block);
            system.run(() => this.openSavedCreationsMenu(player, block, config));
            return;
        }

        switch (response.selection) {
            case 0: {
                // Load
                const newConfig: EmitterConfig = {
                    ...DefaultEmitterConfig,
                    ...creation.config,
                    enabled: true,
                };
                setEmitterConfig(block, newConfig);
                player.sendMessage(`§aLoaded: §5${creation.name}`);
                system.run(() => this.openComposer(player, block));
                break;
            }
            case 1: {
                // Delete
                const success = deleteSavedCreation(index);
                if (success) {
                    player.sendMessage(`§cDeleted: §5${creation.name}`);
                } else {
                    player.sendMessage("§cFailed to delete creation.");
                }
                const config = getEmitterConfig(block);
                system.run(() => this.openSavedCreationsMenu(player, block, config));
                break;
            }
            case 2: {
                // Back
                const config = getEmitterConfig(block);
                system.run(() => this.openSavedCreationsMenu(player, block, config));
                break;
            }
        }
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

            // Auto-set default color for this texture (both start and end)
            const defaultColorIdx = TextureDefaultColors[response.selection] ?? 0;
            config.colorStartIndex = defaultColorIdx;
            config.colorEndIndex = defaultColorIdx;

            // Update legacy RGB fields for compatibility
            const colorPreset = ColorPresets[defaultColorIdx];
            if (colorPreset) {
                config.colorR = colorPreset[1];
                config.colorG = colorPreset[2];
                config.colorB = colorPreset[3];
                config.tintMode = defaultColorIdx !== 0;
            }

            setEmitterConfig(block, config);
            const colorName = ColorPresets[defaultColorIdx]?.[0] || "White";
            player.sendMessage(`§6Texture set to: ${TexturePresets[response.selection]} §7(color: ${colorName})`);
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
        const blendModes = ["Blend (Soft)", "Alpha (Sharp)", "Additive (Glow)"];
        const blendIndex = config.blendMode === "alpha" ? 1 : config.blendMode === "add" ? 2 : 0;

        const form = new ModalFormData()
            .title("§l§5Blend & Opacity")
            .slider("Opacity %", 10, 100, { defaultValue: Math.round(config.alpha * 100), valueStep: 5 })
            .dropdown("Blending Mode", blendModes, {
                defaultValueIndex: blendIndex,
            })
            .toggle("Fade Out Over Lifetime", { defaultValue: config.fadeOut ?? true });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openAppearanceTab(player, block, config));
            return;
        }

        const [alpha, blendIdx, fadeOut] = response.formValues as [number, number, boolean];

        config.alpha = alpha / 100;
        config.blendMode = blendIdx === 0 ? "blend" : blendIdx === 1 ? "alpha" : "add";
        config.fadeOut = fadeOut;

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
            .slider("Speed (0-2)", 0, 20, { defaultValue: Math.round(config.speed * 10), valueStep: 1 })
            .slider("Gravity (-2 float, +2 fall)", -20, 20, { defaultValue: Math.round(config.gravity * 10), valueStep: 1 })
            .slider("Acceleration (-2 to +2)", -20, 20, { defaultValue: Math.round(config.acceleration * 10), valueStep: 1 })
            .slider("Drag (0-10)", 0, 100, { defaultValue: Math.round(config.drag * 10), valueStep: 5 })
            .dropdown("Direction Mode", ["Vector (Specific direction)", "Radial (Explosion)"], {
                defaultValueIndex: config.directionMode === "radial" ? 1 : 0,
            })
            .slider("Vector X (-1 to +1)", -10, 10, { defaultValue: Math.round(config.vectorX * 10), valueStep: 1 })
            .slider("Vector Y (-1 to +1)", -10, 10, { defaultValue: Math.round(config.vectorY * 10), valueStep: 1 })
            .slider("Vector Z (-1 to +1)", -10, 10, { defaultValue: Math.round(config.vectorZ * 10), valueStep: 1 })
            .toggle("Collision (bounce on blocks)", { defaultValue: config.collision })
            .slider("Spin Speed (degrees/sec)", -360, 360, { defaultValue: config.spinSpeed, valueStep: 15 })
            .slider("Spin Randomization (+/-)", 0, 180, { defaultValue: config.spinSpeedRange ?? 0, valueStep: 15 });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openComposer(player, block));
            return;
        }

        const [speed, gravity, acceleration, drag, dirIdx, vectorX, vectorY, vectorZ, collision, spinSpeed, spinSpeedRange] = response.formValues as [
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            boolean,
            number,
            number,
        ];

        config.speed = speed / 10;
        config.gravity = gravity / 10;
        config.acceleration = acceleration / 10;
        config.drag = drag / 10;
        config.directionMode = dirIdx === 0 ? "vector" : "radial";
        config.vectorX = vectorX / 10;
        config.vectorY = vectorY / 10;
        config.vectorZ = vectorZ / 10;
        config.collision = collision;
        config.spinSpeed = spinSpeed;
        config.spinSpeedRange = spinSpeedRange;

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
        const rotationText = config.randomRotation ? `Random ±${config.rotationRange}°` : `Fixed at ${config.initialRotation}°`;

        const form = new ActionFormData()
            .title("§l§2Spawning Rules")
            .body(
                `§lRate:§r ${config.spawnRate}/s | Life: ${config.lifetime.toFixed(1)}s\n` +
                    `§lShape:§r ${config.shape} (r=${config.emissionRadius.toFixed(1)})\n` +
                    `§lOffset:§r ${offsetText}\n` +
                    `§lRotation:§r ${rotationText}`
            )
            .button("§2Rate & Lifetime\n§rParticles per second")
            .button("§2Shape & Radius\n§rEmission area")
            .button("§2Position Offset\n§rXYZ spawn offset")
            .button("§2Initial Rotation\n§rSpawn angle settings")
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
                await this.openSpawningRotationSettings(player, block, config);
                break;
            case 4:
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
            .slider("Particle Lifetime (0.5-30 seconds)", 1, 60, {
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
            .slider("Emission Radius (0-20 blocks)", 0, 80, {
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
            .slider("Offset X (blocks)", -10, 10, {
                defaultValue: Math.round(config.offsetX),
                valueStep: 1,
            })
            .slider("Offset Y (blocks)", -10, 10, {
                defaultValue: Math.round(config.offsetY),
                valueStep: 1,
            })
            .slider("Offset Z (blocks)", -10, 10, {
                defaultValue: Math.round(config.offsetZ),
                valueStep: 1,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openSpawningTab(player, block, config));
            return;
        }

        const [offsetX, offsetY, offsetZ] = response.formValues as [number, number, number];

        config.offsetX = offsetX;
        config.offsetY = offsetY;
        config.offsetZ = offsetZ;

        setEmitterConfig(block, config);
        player.sendMessage("§2Offset settings saved!");
        system.run(() => this.openSpawningTab(player, block, config));
    }

    private static async openSpawningRotationSettings(player: Player, block: Block, config: EmitterConfig) {
        const form = new ModalFormData()
            .title("§l§2Initial Rotation")
            .toggle("Random Rotation on Spawn", { defaultValue: config.randomRotation })
            .slider("Initial Rotation (degrees)", 0, 360, {
                defaultValue: config.initialRotation,
                valueStep: 15,
            })
            .slider("Random Range (±degrees)", 0, 180, {
                defaultValue: config.rotationRange,
                valueStep: 15,
            });

        const response = await form.show(player);
        if (response.canceled) {
            system.run(() => this.openSpawningTab(player, block, config));
            return;
        }

        const [randomRotation, initialRotation, rotationRange] = response.formValues as [boolean, number, number];

        config.randomRotation = randomRotation;
        config.initialRotation = initialRotation;
        config.rotationRange = rotationRange;

        setEmitterConfig(block, config);
        player.sendMessage("§2Rotation settings saved!");
        system.run(() => this.openSpawningTab(player, block, config));
    }
}
