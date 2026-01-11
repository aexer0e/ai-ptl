export class FileCollection {
    public readonly __isCollection = true;
    protected files = new Map<string, unknown>();
    constructor() {}
    get hasFiles() {
        return this.files.size > 0;
    }
    getAll() {
        return [...this.files.entries()];
    }
    get(filePath: string) {
        return this.files.get(filePath);
    }
    clear() {
        this.files.clear();
    }
    add(filePath: string, fileContent: unknown) {
        if (this.files.has(filePath)) {
            console.warn(`Omitting file "${filePath}" from collection because it would overwrite a previously generated file!`);
            return;
        }
        this.files.set(filePath, fileContent);
    }
    has(filePath: string) {
        return this.files.has(filePath);
    }
    addFrom(collection: FileCollection) {
        for (const [filePath, fileContent] of collection.getAll()) {
            const resolvedPath = filePath;
            this.add(resolvedPath, fileContent);
        }
    }
}

// Shape configurations
type ShapeType = "sphere" | "box" | "disc";
type BlendType = "blend" | "alpha" | "glow";
type CollisionType = "none" | "collide";
type TextureModeType = "static" | "animated" | "randomized";
type FacingType = "camera" | "lookup";

interface ShapeConfig {
    component: string;
    content: Record<string, unknown>;
}

// Direction mode: 0 = vector (use vector_x/y/z), 1 = radial (outward), 2 = random (all directions)
// For vector: Uses vector_x/y/z variables passed from script
// For radial: Uses "outwards" string (separate particle variant)
// For random: Uses emitter_initialization to set random direction once at spawn

// Direction array just references the vector variables - random mode sets these via creation_expression
const directionMolang = ["variable.vector_x", "variable.vector_y", "variable.vector_z"];

const shapeConfigs: Record<ShapeType, ShapeConfig> = {
    sphere: {
        component: "minecraft:emitter_shape_sphere",
        content: {
            radius: "variable.emission_radius",
            direction: directionMolang,
        },
    },
    box: {
        component: "minecraft:emitter_shape_box",
        content: {
            half_dimensions: ["variable.emission_radius", "variable.emission_radius", "variable.emission_radius"],
            direction: directionMolang,
        },
    },
    disc: {
        component: "minecraft:emitter_shape_disc",
        content: {
            radius: "variable.emission_radius",
            plane_normal: [0, 1, 0],
            direction: directionMolang,
        },
    },
};

const blendMaterials: Record<BlendType, string> = {
    blend: "particles_blend",
    alpha: "particles_alpha",
    glow: "particles_add",
};

// UV configurations for different texture modes
interface UvConfig {
    texture_width: number;
    texture_height: number;
    uv?: [string, string];
    uv_size?: [number, number];
    flipbook?: {
        base_UV: [string, string];
        size_UV: [number, number];
        step_UV: [number, number];
        frames_per_second: number;
        max_frame: number;
        stretch_to_lifetime: boolean;
        loop: boolean;
    };
}

function getUvConfig(textureMode: TextureModeType): UvConfig {
    switch (textureMode) {
        case "animated":
            // 8 cols x 10 rows, 32x32 each = 256x320
            // variable.animation_row selects which animation (0-9)
            // Flipbook plays through 8 frames horizontally
            // Note: frames_per_second must be a number, so we use stretch_to_lifetime
            // to sync animation with particle lifetime for dynamic control
            return {
                texture_width: 256,
                texture_height: 320,
                flipbook: {
                    base_UV: ["0", "variable.animation_row * 32"],
                    size_UV: [32, 32],
                    step_UV: [32, 0], // Move right through frames
                    frames_per_second: 12, // Fixed FPS (lifetime controls effective speed)
                    max_frame: 8,
                    stretch_to_lifetime: true, // Animation syncs to particle lifetime
                    loop: false, // No loop when stretching to lifetime
                },
            };
        case "randomized":
            // 5x5 grid, 32x32 each = 160x160
            // variable.random_row selects which row (0-4), particle_random_1 picks column
            return {
                texture_width: 160,
                texture_height: 160,
                uv: ["math.floor(variable.particle_random_1 * 5) * 32", "variable.random_row * 32"],
                uv_size: [32, 32],
            };
        case "static":
        default:
            // 4x4 grid, 32x32 each = 128x128
            return {
                texture_width: 128,
                texture_height: 128,
                uv: ["math.mod(variable.texture_id, 4) * 32", "math.floor(variable.texture_id / 4) * 32"],
                uv_size: [32, 32],
            };
    }
}

function getTextureForMode(textureMode: TextureModeType, blend: BlendType): string {
    const glowSuffix = blend === "glow" ? "_glow" : "";
    switch (textureMode) {
        case "animated":
            return `textures/particle/animated_atlas${glowSuffix}`;
        case "randomized":
            return `textures/particle/randomized_atlas${glowSuffix}`;
        case "static":
        default:
            return `textures/particle/atmosphere_atlas${glowSuffix}`;
    }
}

// Direction mode for particle generation
// - "dynamic": Uses vector_x/y/z variables passed from script (for vector mode)
// - "radial": Uses Minecraft's "outwards" direction string
// - "random": Uses emitter_initialization to set random direction once at spawn
type DirectionModeType = "dynamic" | "radial" | "random";

// Get shape content with direction mode applied
function getShapeContent(shape: ShapeType, dirMode: DirectionModeType): Record<string, unknown> {
    const baseContent = shapeConfigs[shape].content;

    if (dirMode === "radial") {
        // For radial mode, use Minecraft's built-in "outwards" direction
        return {
            ...baseContent,
            direction: "outwards",
        };
    }

    // Dynamic and random modes use vector variables (random sets them via creation_expression)
    return baseContent;
}

function generateParticle(
    shape: ShapeType,
    blend: BlendType,
    collision: CollisionType,
    textureMode: TextureModeType,
    facing: FacingType,
    dirMode: DirectionModeType = "dynamic"
): Record<string, unknown> {
    const shapeConfig = shapeConfigs[shape];
    const shapeContent = getShapeContent(shape, dirMode);
    const material = blendMaterials[blend];
    const uvConfig = getUvConfig(textureMode);
    const texture = getTextureForMode(textureMode, blend);

    // Build identifier suffix
    const shapeSuffix = shape === "sphere" ? "" : `_${shape}`;
    const blendSuffix = blend === "blend" ? "" : `_${blend}`;
    const collisionSuffix = collision === "none" ? "" : "_collide";
    const textureModeSuffix = textureMode === "static" ? "" : `_${textureMode}`;
    const facingSuffix = facing === "camera" ? "" : "_lookup";
    const dirModeSuffix = dirMode === "dynamic" ? "" : `_${dirMode}`;
    const identifier = `ns_ptl:master_particle${shapeSuffix}${blendSuffix}${collisionSuffix}${textureModeSuffix}${facingSuffix}${dirModeSuffix}`;

    // Build components
    // Spawn rate is now handled at script level for reliable low spawn rates
    // Each spawnParticle call creates exactly 1 particle via emitter_rate_instant
    const components: Record<string, unknown> = {};

    // For random mode, add emitter_initialization to set random direction once at spawn
    if (dirMode === "random") {
        components["minecraft:emitter_initialization"] = {
            // Set random direction vector once when particle spawns (uniform on sphere)
            // Using simple random(-1,1) for each axis - Minecraft normalizes direction automatically
            creation_expression:
                "variable.vector_x = math.random(-1, 1); variable.vector_y = math.random(-1, 1); variable.vector_z = math.random(-1, 1);",
        };
    }

    Object.assign(components, {
        "minecraft:emitter_rate_instant": { num_particles: 1 },
        "minecraft:emitter_lifetime_once": { active_time: 1 },
        [shapeConfig.component]: shapeContent,
        "minecraft:particle_initial_speed": "variable.speed",
        "minecraft:particle_initial_spin": {
            rotation:
                "variable.random_rotation == 1 ? math.random(-variable.rotation_range, variable.rotation_range) + variable.initial_rotation : variable.initial_rotation",
            rotation_rate: "variable.spin_speed + math.random(-variable.spin_speed_range, variable.spin_speed_range)",
        },
        "minecraft:particle_lifetime_expression": { max_lifetime: "variable.lifetime" },
        "minecraft:particle_motion_dynamic": {
            // When random_movement is enabled, add sinusoidal oscillation for natural wandering
            // Uses particle_random values (set at spawn) combined with age for unique per-particle motion
            // Each axis uses different random values and frequencies for unbiased motion
            linear_acceleration: [
                "variable.random_movement == 1 ? math.sin(variable.particle_age * 3.0 + variable.particle_random_1 * 6.283185307) * variable.speed * 2 : 0",
                "(variable.gravity * -1) + variable.acceleration + (variable.random_movement == 1 ? math.sin(variable.particle_age * 2.5 + variable.particle_random_2 * 6.283185307) * variable.speed * 2 : 0)",
                "variable.random_movement == 1 ? math.sin(variable.particle_age * 2.7 + variable.particle_random_3 * 6.283185307) * variable.speed * 2 : 0",
            ],
            linear_drag_coefficient: "variable.drag",
            rotation_drag_coefficient: 0.1,
        },
        "minecraft:particle_appearance_billboard": {
            size: [
                "math.lerp(variable.size_start, variable.size_end, variable.particle_age / variable.particle_lifetime)",
                "math.lerp(variable.size_start, variable.size_end, variable.particle_age / variable.particle_lifetime)",
            ],
            facing_camera_mode: facing === "lookup" ? "emitter_transform_xz" : "lookat_xyz",
            uv: uvConfig,
        },
        "minecraft:particle_appearance_tinting": {
            color: [
                "2*math.lerp(variable.color_r, variable.color_end_r, variable.particle_age / variable.particle_lifetime)",
                "2*math.lerp(variable.color_g, variable.color_end_g, variable.particle_age / variable.particle_lifetime)",
                "2*math.lerp(variable.color_b, variable.color_end_b, variable.particle_age / variable.particle_lifetime)",
                "variable.fade_out == 1 ? variable.alpha * (1 - variable.particle_age / variable.particle_lifetime) : variable.alpha",
            ],
        },
        "minecraft:particle_appearance_lighting": {},
    });

    // Add collision component only for collision variants
    if (collision === "collide") {
        components["minecraft:particle_motion_collision"] = {
            collision_radius: 0.1,
            coefficient_of_restitution: 0.5,
            collision_drag: 1,
            expire_on_contact: false,
        };
    }

    return {
        format_version: "1.10.0",
        particle_effect: {
            description: {
                identifier,
                basic_render_parameters: {
                    material,
                    texture,
                },
            },
            components,
        },
    };
}

function getFileName(
    shape: ShapeType,
    blend: BlendType,
    collision: CollisionType,
    textureMode: TextureModeType,
    facing: FacingType,
    dirMode: DirectionModeType = "dynamic"
): string {
    const shapeSuffix = shape === "sphere" ? "" : `_${shape}`;
    const blendSuffix = blend === "blend" ? "" : `_${blend}`;
    const collisionSuffix = collision === "none" ? "" : "_collide";
    const textureModeSuffix = textureMode === "static" ? "" : `_${textureMode}`;
    const facingSuffix = facing === "camera" ? "" : "_lookup";
    const dirModeSuffix = dirMode === "dynamic" ? "" : `_${dirMode}`;
    return `./master_particle${shapeSuffix}${blendSuffix}${collisionSuffix}${textureModeSuffix}${facingSuffix}${dirModeSuffix}.particle.json`;
}

// Generate all combinations:
// - Dynamic direction (vector via variables): 3 shapes × 3 blends × 2 collisions × 3 texture modes × 2 facings = 108 files
// - Radial direction (uses "outwards"): 3 shapes × 3 blends × 2 collisions × 3 texture modes × 2 facings = 108 files
// - Random direction (uses emitter_initialization): 3 shapes × 3 blends × 2 collisions × 3 texture modes × 2 facings = 108 files
// Total: 324 files
const shapes: ShapeType[] = ["sphere", "box", "disc"];
const blends: BlendType[] = ["blend", "alpha", "glow"];
const collisions: CollisionType[] = ["none", "collide"];
const textureModes: TextureModeType[] = ["static", "animated", "randomized"];
const facings: FacingType[] = ["camera", "lookup"];
const dirModes: DirectionModeType[] = ["dynamic", "radial", "random"];

const files = new FileCollection();

for (const shape of shapes) {
    for (const blend of blends) {
        for (const collision of collisions) {
            for (const textureMode of textureModes) {
                for (const facing of facings) {
                    for (const dirMode of dirModes) {
                        const particle = generateParticle(shape, blend, collision, textureMode, facing, dirMode);
                        const fileName = getFileName(shape, blend, collision, textureMode, facing, dirMode);
                        files.add(fileName, particle);
                    }
                }
            }
        }
    }
}

export default files;
