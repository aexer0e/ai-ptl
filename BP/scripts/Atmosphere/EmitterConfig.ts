// Atmosphere+ GDDv2 - Emitter Configuration Types
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
 * - "blend": Normal alpha blending
 * - "add": Additive blending (glowing effect)
 */
export type BlendMode = "blend" | "add";

/**
 * Complete emitter configuration following GDDv2 Particle Composer
 */
export interface EmitterConfig {
    // === Tab A: Appearance ===
    renderStyle: RenderStyle;
    /** Texture index 0-15 (0 = soft circle for basic, 1-15 = presets) */
    textureId: number;
    /** Whether to tint preset textures with RGB values */
    tintMode: boolean;
    /** RGB color values 0.0-1.0 */
    colorR: number;
    colorG: number;
    colorB: number;
    /** Alpha/opacity 0.0-1.0 */
    alpha: number;
    /** Blending mode */
    blendMode: BlendMode;
    /** Size when particle spawns (0.1-5.0) */
    sizeStart: number;
    /** Size when particle dies (0.0-5.0) */
    sizeEnd: number;

    // === Tab B: Physics & Motion ===
    /** Initial velocity (0.0-2.0) */
    speed: number;
    /** Gravity effect (-2.0 to 2.0, positive=fall, negative=float) */
    gravity: number;
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

    // === Tab C: Spawning Rules ===
    /** Particles per second (1-50) */
    spawnRate: number;
    /** How long each particle lives in seconds (0.5-10) */
    lifetime: number;
    /** Emission radius (0-5.0) */
    emissionRadius: number;
    /** Emission shape */
    shape: EmissionShape;

    // === Tab D: Advanced ===
    /** Rotation speed of particle texture */
    spinSpeed: number;
    /** Whether particle always faces camera */
    faceCamera: boolean;
    /** Pulsing opacity effect */
    pulse: boolean;

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
 * Default configuration for new emitters
 */
export const DefaultEmitterConfig: EmitterConfig = {
    // Appearance
    renderStyle: "basic",
    textureId: 0,
    tintMode: false,
    colorR: 1.0,
    colorG: 1.0,
    colorB: 1.0,
    alpha: 0.8,
    blendMode: "blend",
    sizeStart: 0.5,
    sizeEnd: 0.2,

    // Physics
    speed: 0.5,
    gravity: -0.3,
    drag: 1.0,
    directionMode: "vector",
    vectorX: 0.0,
    vectorY: 1.0,
    vectorZ: 0.0,
    collision: false,

    // Spawning
    spawnRate: 10,
    lifetime: 3.0,
    emissionRadius: 0.5,
    shape: "sphere",

    // Advanced
    spinSpeed: 0,
    faceCamera: true,
    pulse: false,

    // System
    enabled: true,
};

/**
 * Generate a config key for storing emitter data
 */
export function getConfigKey(x: number, y: number, z: number, dimId: string): string {
    return `emitter:${dimId}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}
