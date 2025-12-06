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

interface ShapeConfig {
    component: string;
    content: Record<string, unknown>;
}

const shapeConfigs: Record<ShapeType, ShapeConfig> = {
    sphere: {
        component: "minecraft:emitter_shape_sphere",
        content: {
            radius: "variable.emission_radius",
            direction: [
                "variable.direction_mode == 1 ? (variable.particle_random_1 - 0.5) * 2 : variable.vector_x",
                "variable.direction_mode == 1 ? (variable.particle_random_2 - 0.5) * 2 : variable.vector_y",
                "variable.direction_mode == 1 ? (variable.particle_random_1 * variable.particle_random_2 - 0.25) * 4 : variable.vector_z",
            ],
        },
    },
    box: {
        component: "minecraft:emitter_shape_box",
        content: {
            half_dimensions: ["variable.emission_radius", "variable.emission_radius", "variable.emission_radius"],
            direction: [
                "variable.direction_mode == 1 ? (variable.particle_random_1 - 0.5) * 2 : variable.vector_x",
                "variable.direction_mode == 1 ? (variable.particle_random_2 - 0.5) * 2 : variable.vector_y",
                "variable.direction_mode == 1 ? (variable.particle_random_1 * variable.particle_random_2 - 0.25) * 4 : variable.vector_z",
            ],
        },
    },
    disc: {
        component: "minecraft:emitter_shape_disc",
        content: {
            radius: "variable.emission_radius",
            plane_normal: [0, 1, 0],
            direction: [
                "variable.direction_mode == 1 ? (variable.particle_random_1 - 0.5) * 2 : variable.vector_x",
                "variable.direction_mode == 1 ? (variable.particle_random_2 - 0.5) * 2 : variable.vector_y",
                "variable.direction_mode == 1 ? (variable.particle_random_1 * variable.particle_random_2 - 0.25) * 4 : variable.vector_z",
            ],
        },
    },
};

const blendMaterials: Record<BlendType, string> = {
    blend: "particles_blend",
    alpha: "particles_alpha",
    glow: "particles_add",
};

function generateParticle(shape: ShapeType, blend: BlendType, collision: CollisionType): Record<string, unknown> {
    const shapeConfig = shapeConfigs[shape];
    const material = blendMaterials[blend];

    // Build identifier suffix
    const shapeSuffix = shape === "sphere" ? "" : `_${shape}`;
    const blendSuffix = blend === "blend" ? "" : `_${blend}`;
    const collisionSuffix = collision === "none" ? "" : "_collide";
    const identifier = `ns_ptl:master_particle${shapeSuffix}${blendSuffix}${collisionSuffix}`;

    // Build components
    const components: Record<string, unknown> = {
        "minecraft:emitter_rate_steady": { spawn_rate: "variable.spawn_rate", max_particles: 200 },
        "minecraft:emitter_lifetime_looping": { active_time: 1 },
        [shapeConfig.component]: shapeConfig.content,
        "minecraft:particle_initial_speed": "variable.speed",
        "minecraft:particle_initial_spin": {
            rotation: "variable.random_rotation == 1 ? math.random(-variable.rotation_range, variable.rotation_range) + variable.initial_rotation : variable.initial_rotation",
            rotation_rate: "variable.spin_speed",
        },
        "minecraft:particle_lifetime_expression": { max_lifetime: "variable.lifetime" },
        "minecraft:particle_motion_dynamic": {
            linear_acceleration: [0, "(variable.gravity * -1) + variable.acceleration", 0],
            linear_drag_coefficient: "variable.drag",
            rotation_drag_coefficient: 0.1,
        },
        "minecraft:particle_appearance_billboard": {
            size: [
                "math.lerp(variable.size_start, variable.size_end, variable.particle_age / variable.particle_lifetime)",
                "math.lerp(variable.size_start, variable.size_end, variable.particle_age / variable.particle_lifetime)",
            ],
            facing_camera_mode: "lookat_xyz",
            uv: {
                texture_width: 128,
                texture_height: 128,
                uv: ["math.mod(variable.texture_id, 4) * 32", "math.floor(variable.texture_id / 4) * 32"],
                uv_size: [32, 32],
            },
        },
        "minecraft:particle_appearance_tinting": {
            color: [
                "math.lerp(variable.color_r, variable.color_end_r, variable.particle_age / variable.particle_lifetime)",
                "math.lerp(variable.color_g, variable.color_end_g, variable.particle_age / variable.particle_lifetime)",
                "math.lerp(variable.color_b, variable.color_end_b, variable.particle_age / variable.particle_lifetime)",
                "variable.fade_out == 1 ? variable.alpha * (1 - variable.particle_age / variable.particle_lifetime) : variable.alpha",
            ],
        },
        "minecraft:particle_appearance_lighting": {},
    };

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
                    texture: "textures/particle/atmosphere_atlas",
                },
            },
            components,
        },
    };
}

function getFileName(shape: ShapeType, blend: BlendType, collision: CollisionType): string {
    const shapeSuffix = shape === "sphere" ? "" : `_${shape}`;
    const blendSuffix = blend === "blend" ? "" : `_${blend}`;
    const collisionSuffix = collision === "none" ? "" : "_collide";
    return `./master_particle${shapeSuffix}${blendSuffix}${collisionSuffix}.particle.json`;
}

// Generate all combinations: 3 shapes × 3 blends × 2 collisions = 18 files
const shapes: ShapeType[] = ["sphere", "box", "disc"];
const blends: BlendType[] = ["blend", "alpha", "glow"];
const collisions: CollisionType[] = ["none", "collide"];

const files = new FileCollection();

for (const shape of shapes) {
    for (const blend of blends) {
        for (const collision of collisions) {
            const particle = generateParticle(shape, blend, collision);
            const fileName = getFileName(shape, blend, collision);
            files.add(fileName, particle);
        }
    }
}

export default files;
