// DIY Particles - Emitter Configuration Types
// "Infinite atmosphere, one block."

/**
 * Render style for particles
 * - "basic": Uses generic soft circle, enables RGB color control
 * - "preset": Uses a sprite from the atlas, optionally tinted
 */
export type RenderStyle = "basic" | "preset";

/**
 * Direction mode for particle motion
 * - "vector": Particles move in a specific direction
 * - "radial": Particles explode outward from center
 */
export type DirectionMode = "vector" | "radial";

/**
 * Emission shape for particle spawning
 */
export type EmissionShape = "sphere" | "box" | "disc";

/**
 * Blending mode for particle rendering
 * - "blend": Normal blending (semi-transparent)
 * - "alpha": Alpha test blending (solid edges)
 * - "add": Additive blending (glowing effect)
 */
export type BlendMode = "blend" | "alpha" | "add";

/**
 * Complete emitter configuration following GDDv2 Particle Composer
 */
export interface EmitterConfig {
    // === Tab A: Appearance ===
    /** Texture index 0-15 (0 = soft circle, 1-15 = presets) */
    textureId: number;
    /** Start color preset index (0 = None/White) */
    colorStartIndex: number;
    /** End color preset index (0 = None/White, same as start = solid color) */
    colorEndIndex: number;
    /** Alpha/opacity 0.0-1.0 */
    alpha: number;
    /** Whether particle fades out over lifetime */
    fadeOut: boolean;
    /** Blending mode */
    blendMode: BlendMode;
    /** Size when particle spawns (0.1-5.0) */
    sizeStart: number;
    /** Size when particle dies (0.0-5.0) */
    sizeEnd: number;

    // === Legacy fields (kept for compatibility) ===
    renderStyle: RenderStyle;
    tintMode: boolean;
    colorR: number;
    colorG: number;
    colorB: number;

    // === Tab B: Physics & Motion ===
    /** Initial velocity (0.0-2.0) */
    speed: number;
    /** Gravity effect (-2.0 to 2.0, positive=fall, negative=float) */
    gravity: number;
    /** Acceleration over lifetime (-2.0 to 2.0) */
    acceleration: number;
    /** Air resistance (0.0-10.0) */
    drag: number;
    /** Direction mode */
    directionMode: DirectionMode;
    /** Direction vector components (-1.0 to 1.0) */
    vectorX: number;
    vectorY: number;
    vectorZ: number;
    /** Whether particles collide with blocks */
    collision: boolean;
    /** Rotation speed of particle texture (degrees/sec) */
    spinSpeed: number;

    // === Tab C: Spawning Rules ===
    /** Particles per second (1-50) */
    spawnRate: number;
    /** How long each particle lives in seconds (0.5-10) */
    lifetime: number;
    /** Emission radius (0-5.0) */
    emissionRadius: number;
    /** Emission shape */
    shape: EmissionShape;
    /** Spawn offset X (-2.0 to 2.0) */
    offsetX: number;
    /** Spawn offset Y (-2.0 to 2.0) */
    offsetY: number;
    /** Spawn offset Z (-2.0 to 2.0) */
    offsetZ: number;
    /** Whether to randomize initial rotation on spawn */
    randomRotation: boolean;
    /** Initial rotation angle in degrees (0-360) when not random */
    initialRotation: number;
    /** Range of random rotation (+/- degrees from initialRotation) */
    rotationRange: number;

    // === System ===
    /** Whether the emitter is currently active */
    enabled: boolean;
}

/**
 * Preset texture names for the atlas
 * Index 0 is reserved for the soft circle (basic mode)
 */
export const TexturePresets: string[] = [
    "Soft Circle", // 0 - Basic mode
    "Star", // 1
    "Heart", // 2
    "Skull", // 3
    "Leaf", // 4
    "Smoke Puff", // 5
    "Spark", // 6
    "Bubble", // 7
    "Rune", // 8
    "Flame", // 9
    "Snowflake", // 10
    "Raindrop", // 11
    "Dust", // 12
    "Magic Orb", // 13
    "Eye", // 14
    "Glint", // 15
];

/**
 * Default color index for each texture when selected.
 * Maps texture ID to ColorPresets index.
 * This allows textures to auto-set appropriate colors when chosen.
 */
export const TextureDefaultColors: number[] = [
    0, // Soft Circle → White (neutral)
    3, // Star → Yellow
    1, // Heart → Red
    0, // Skull → White
    5, // Leaf → Green
    11, // Smoke Puff → Black (gray)
    3, // Spark → Yellow
    6, // Bubble → Cyan
    8, // Rune → Purple
    2, // Flame → Orange
    6, // Snowflake → Cyan
    7, // Raindrop → Blue
    10, // Dust → Brown
    8, // Magic Orb → Purple
    1, // Eye → Red
    3, // Glint → Yellow
];

/**
 * Preset colors for tinting particles
 * Each entry is [name, R, G, B] with RGB values 0.0-1.0
 */
export const ColorPresets: [string, number, number, number][] = [
    ["None (White)", 1.0, 1.0, 1.0],
    ["Red", 1.0, 0.2, 0.2],
    ["Orange", 1.0, 0.5, 0.1],
    ["Yellow", 1.0, 1.0, 0.2],
    ["Lime", 0.5, 1.0, 0.2],
    ["Green", 0.2, 0.8, 0.2],
    ["Cyan", 0.2, 1.0, 1.0],
    ["Blue", 0.2, 0.4, 1.0],
    ["Purple", 0.6, 0.2, 1.0],
    ["Pink", 1.0, 0.4, 0.8],
    ["Brown", 0.6, 0.4, 0.2],
    ["Black", 0.1, 0.1, 0.1],
];

/**
 * Default configuration for new emitters
 */
export const DefaultEmitterConfig: EmitterConfig = {
    // Appearance
    textureId: 1, // Default to Star instead of Soft Circle
    colorStartIndex: 0, // None (White)
    colorEndIndex: 0, // None (White) - same as start = no gradient
    alpha: 0.8,
    fadeOut: true,
    blendMode: "blend",
    sizeStart: 0.5,
    sizeEnd: 0.2,

    // Legacy (kept for compatibility)
    renderStyle: "preset",
    tintMode: false,
    colorR: 1.0,
    colorG: 1.0,
    colorB: 1.0,

    // Physics
    speed: 0.5,
    gravity: -0.3,
    acceleration: 0.0,
    drag: 1.0,
    directionMode: "vector",
    vectorX: 0.0,
    vectorY: 1.0,
    vectorZ: 0.0,
    collision: false,
    spinSpeed: 0,

    // Spawning
    spawnRate: 10,
    lifetime: 3.0,
    emissionRadius: 0.5,
    shape: "sphere",
    offsetX: 0.0,
    offsetY: 0.0,
    offsetZ: 0.0,
    randomRotation: true,
    initialRotation: 0,
    rotationRange: 180,

    // System
    enabled: true,
};

/**
 * Generate a config key for storing emitter data
 */
export function getConfigKey(x: number, y: number, z: number, dimId: string): string {
    return `emitter:${dimId}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

/**
 * Preset particle effect configuration
 */
export interface ParticlePreset {
    /** Display name for the preset */
    name: string;
    /** Short description of the effect */
    description: string;
    /** Color code for button display (e.g., "6" for gold) */
    color: string;
    /** The emitter configuration to apply */
    config: Partial<EmitterConfig>;
}

/**
 * Pre-configured particle effect presets
 * Each preset overrides specific values from DefaultEmitterConfig
 */
export const ParticlePresets: ParticlePreset[] = [
    {
        name: "Campfire",
        description: "Warm flickering flames rising upward",
        color: "6", // Gold/Orange for fire
        config: {
            textureId: 9, // Flame
            colorStartIndex: 2, // Orange
            colorEndIndex: 1, // Red
            alpha: 0.9,
            blendMode: "add",
            sizeStart: 0.4,
            sizeEnd: 0.1,
            speed: 0.6,
            gravity: -0.5,
            drag: 0.5,
            directionMode: "vector",
            vectorX: 0.0,
            vectorY: 1.0,
            vectorZ: 0.0,
            spawnRate: 15,
            lifetime: 2.0,
            emissionRadius: 0.3,
            shape: "disc",
            spinSpeed: 30,
        },
    },
    {
        name: "Enchantment Runes",
        description: "Mystical runes floating upward",
        color: "5", // Purple for magic
        config: {
            textureId: 8, // Rune
            colorStartIndex: 8, // Purple
            colorEndIndex: 6, // Cyan
            alpha: 0.85,
            blendMode: "add",
            sizeStart: 0.3,
            sizeEnd: 0.0,
            speed: 0.3,
            gravity: -0.4,
            drag: 2.0,
            directionMode: "radial",
            spawnRate: 8,
            lifetime: 3.5,
            emissionRadius: 1.0,
            shape: "sphere",
            spinSpeed: 90,
        },
    },
    {
        name: "Soul Fire",
        description: "Eerie blue ghostly flames",
        color: "3", // Dark cyan for soul
        config: {
            textureId: 9, // Flame
            colorStartIndex: 6, // Cyan
            colorEndIndex: 7, // Blue
            alpha: 0.8,
            blendMode: "add",
            sizeStart: 0.5,
            sizeEnd: 0.1,
            speed: 0.5,
            gravity: -0.6,
            drag: 0.8,
            directionMode: "vector",
            vectorX: 0.1,
            vectorY: 1.0,
            vectorZ: 0.0,
            spawnRate: 12,
            lifetime: 2.5,
            emissionRadius: 0.4,
            shape: "disc",
            spinSpeed: 45,
        },
    },
    {
        name: "Water Fountain",
        description: "Droplets spraying up and falling",
        color: "9", // Blue for water
        config: {
            textureId: 7, // Bubble
            colorStartIndex: 6, // Cyan
            colorEndIndex: 7, // Blue
            alpha: 0.7,
            blendMode: "blend",
            sizeStart: 0.2,
            sizeEnd: 0.15,
            speed: 1.2,
            gravity: 0.8,
            drag: 0.2,
            directionMode: "vector",
            vectorX: 0.0,
            vectorY: 1.0,
            vectorZ: 0.0,
            spawnRate: 20,
            lifetime: 2.0,
            emissionRadius: 0.2,
            shape: "disc",
            spinSpeed: 0,
            collision: true,
        },
    },
    {
        name: "Fireflies",
        description: "Gentle glowing orbs drifting",
        color: "2", // Dark green for nature
        config: {
            textureId: 13, // Magic Orb
            colorStartIndex: 3, // Yellow
            colorEndIndex: 4, // Lime
            alpha: 0.9,
            blendMode: "add",
            sizeStart: 0.15,
            sizeEnd: 0.1,
            speed: 0.15,
            gravity: -0.05,
            drag: 3.0,
            directionMode: "radial",
            spawnRate: 5,
            lifetime: 5.0,
            emissionRadius: 2.0,
            shape: "sphere",
            spinSpeed: 0,
        },
    },
    {
        name: "Snow Globe",
        description: "Gentle snowflakes drifting down",
        color: "8", // Dark gray for winter
        config: {
            textureId: 10, // Snowflake
            colorStartIndex: 0, // White
            colorEndIndex: 0, // White
            alpha: 0.9,
            blendMode: "blend",
            sizeStart: 0.25,
            sizeEnd: 0.2,
            speed: 0.2,
            gravity: 0.15,
            drag: 2.5,
            directionMode: "vector",
            vectorX: 0.2,
            vectorY: -1.0,
            vectorZ: 0.1,
            spawnRate: 12,
            lifetime: 4.0,
            emissionRadius: 1.5,
            shape: "box",
            spinSpeed: 60,
        },
    },
    {
        name: "Portal Swirl",
        description: "Spinning particles like a portal",
        color: "5", // Purple for portal
        config: {
            textureId: 6, // Spark
            colorStartIndex: 8, // Purple
            colorEndIndex: 9, // Pink
            alpha: 0.85,
            blendMode: "add",
            sizeStart: 0.2,
            sizeEnd: 0.05,
            speed: 0.8,
            gravity: 0.0,
            drag: 1.5,
            directionMode: "radial",
            spawnRate: 25,
            lifetime: 1.5,
            emissionRadius: 0.8,
            shape: "disc",
            spinSpeed: 180,
            offsetY: 0.5,
        },
    },
    {
        name: "Toxic Fumes",
        description: "Noxious green smoke rising",
        color: "2", // Dark green for toxic
        config: {
            textureId: 5, // Smoke Puff
            colorStartIndex: 4, // Lime
            colorEndIndex: 5, // Green
            alpha: 0.6,
            blendMode: "blend",
            sizeStart: 0.3,
            sizeEnd: 0.8,
            speed: 0.25,
            gravity: -0.3,
            drag: 1.0,
            directionMode: "vector",
            vectorX: 0.0,
            vectorY: 1.0,
            vectorZ: 0.0,
            spawnRate: 8,
            lifetime: 4.0,
            emissionRadius: 0.5,
            shape: "sphere",
            spinSpeed: 15,
        },
    },
];
