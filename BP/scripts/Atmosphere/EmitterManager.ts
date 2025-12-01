import { Dimension, MolangVariableMap, system, Vector3, world } from "@minecraft/server";
import { DirectionType, ParticleTypesMap } from "./ParticleTypes";

// Emitter configuration stored in world dynamic properties (keyed by location)
export interface EmitterConfig {
    particleTypeId: string; // ID from ParticleTypes
    density: number; // 1-10
    spread: number; // 0-3 (block area)
    direction: DirectionType; // up, down, omni
    requiresRedstone: boolean; // Always on vs redstone required
    enabled: boolean; // Is the emitter currently active
}

export const DefaultEmitterConfig: EmitterConfig = {
    particleTypeId: "rising_steam",
    density: 5,
    spread: 0,
    direction: "up",
    requiresRedstone: false,
    enabled: true,
};

const scanRadius = 48;
const tickInterval = 10; // 0.5 seconds

class _EmitterManager {
    private activeEmitters: Map<string, { location: Vector3; dimension: Dimension; config: EmitterConfig }> = new Map();
    private molangVars = new MolangVariableMap();

    static init() {
        const instance = new _EmitterManager();
        globalThis.EmitterManager = instance;

        // Start the particle spawning loop
        system.runInterval(() => instance.tick(), tickInterval);

        // Listen for block placement to register emitters
        EventSubscriber.subscribe("WorldAfterEvents", "playerPlaceBlock", (event) => {
            if (event.block.typeId === "ns_ptl:universal_emitter") {
                instance.registerEmitterAt(event.block.location, event.block.dimension);
            }
        });

        // Listen for block breaks to unregister emitters
        EventSubscriber.subscribe("WorldAfterEvents", "playerBreakBlock", (event) => {
            if (event.brokenBlockPermutation.type.id === "ns_ptl:universal_emitter") {
                instance.unregisterEmitter(event.block.location, event.dimension);
            }
        });

        // Scan for existing emitters on world load
        EventSubscriber.subscribe("WorldAfterEvents", "worldLoad", () => {
            instance.scanForEmitters();
        });

        BroadcastUtil.debug("EmitterManager initialized");
    }

    private getLocationKey(location: Vector3, dimension: Dimension): string {
        return `${dimension.id}:${Math.floor(location.x)},${Math.floor(location.y)},${Math.floor(location.z)}`;
    }

    private getPropertyKey(location: Vector3, dimension: Dimension): string {
        return `emitter:${this.getLocationKey(location, dimension)}`;
    }

    registerEmitterAt(location: Vector3, dimension: Dimension) {
        const key = this.getLocationKey(location, dimension);
        const config = this.getEmitterConfigAt(location, dimension);
        this.activeEmitters.set(key, {
            location: { ...location },
            dimension,
            config,
        });
    }

    unregisterEmitter(location: Vector3, dimension: Dimension) {
        const key = this.getLocationKey(location, dimension);
        this.activeEmitters.delete(key);

        // Clean up stored config
        const propKey = this.getPropertyKey(location, dimension);
        try {
            world.setDynamicProperty(propKey, undefined);
        } catch {
            // Property may not exist
        }
    }

    getEmitterConfigAt(location: Vector3, dimension: Dimension): EmitterConfig {
        try {
            const propKey = this.getPropertyKey(location, dimension);
            const configStr = world.getDynamicProperty(propKey) as string | undefined;
            if (configStr) {
                return JSON.parse(configStr) as EmitterConfig;
            }
        } catch {
            // Invalid config, return default
        }
        return { ...DefaultEmitterConfig };
    }

    setEmitterConfigAt(location: Vector3, dimension: Dimension, config: EmitterConfig) {
        const propKey = this.getPropertyKey(location, dimension);
        world.setDynamicProperty(propKey, JSON.stringify(config));

        // Update the cached config
        const key = this.getLocationKey(location, dimension);
        if (this.activeEmitters.has(key)) {
            const emitter = this.activeEmitters.get(key)!;
            emitter.config = config;
        } else {
            // Register if not already tracked
            this.activeEmitters.set(key, {
                location: { ...location },
                dimension,
                config,
            });
        }
    }

    private scanForEmitters() {
        // Scan around all players for emitter blocks
        for (const player of world.getAllPlayers()) {
            try {
                const dimension = player.dimension;
                const center = player.location;
                const startX = Math.floor(center.x) - scanRadius;
                const startY = Math.max(-64, Math.floor(center.y) - scanRadius);
                const startZ = Math.floor(center.z) - scanRadius;
                const endX = Math.floor(center.x) + scanRadius;
                const endY = Math.min(320, Math.floor(center.y) + scanRadius);
                const endZ = Math.floor(center.z) + scanRadius;

                // Scan in chunks for efficiency
                for (let x = startX; x <= endX; x += 8) {
                    for (let y = startY; y <= endY; y += 8) {
                        for (let z = startZ; z <= endZ; z += 8) {
                            try {
                                const block = dimension.getBlock({ x, y, z });
                                if (block && block.typeId === "ns_ptl:universal_emitter") {
                                    this.registerEmitterAt(block.location, dimension);
                                }
                            } catch {
                                // Block may be in unloaded chunk
                            }
                        }
                    }
                }
            } catch {
                // Player may be in unloaded chunks
            }
        }
    }

    private tick() {
        const now = system.currentTick;

        for (const [key, emitter] of this.activeEmitters) {
            try {
                // Verify the block still exists
                const block = emitter.dimension.getBlock(emitter.location);
                if (!block || block.typeId !== "ns_ptl:universal_emitter") {
                    this.activeEmitters.delete(key);
                    continue;
                }

                // Refresh config from storage
                const config = this.getEmitterConfigAt(emitter.location, emitter.dimension);
                emitter.config = config;

                // Check if emitter should be active
                if (!config.enabled) continue;

                if (config.requiresRedstone) {
                    // Check for redstone power
                    const redstonePower = block.getRedstonePower();
                    if (!redstonePower || redstonePower === 0) continue;
                }

                // Spawn particles
                this.spawnParticles(emitter.location, emitter.dimension, config);
            } catch {
                // Block may be in unloaded chunk
            }
        }

        // Periodically rescan for emitters
        if (now % 200 === 0) {
            this.scanForEmitters();
        }
    }

    private spawnParticles(location: Vector3, dimension: Dimension, config: EmitterConfig) {
        const particleType = ParticleTypesMap.get(config.particleTypeId);
        if (!particleType) return;

        // Set molang variables for the particle effect
        this.molangVars.setFloat("emitter_density", config.density);
        this.molangVars.setFloat("emitter_spread", config.spread);

        // Calculate spawn position based on direction
        const spawnPos = {
            x: location.x + 0.5,
            y: location.y + 0.5,
            z: location.z + 0.5,
        };

        // Adjust Y based on direction
        if (config.direction === "down") {
            spawnPos.y = location.y;
        } else if (config.direction === "up") {
            spawnPos.y = location.y + 1;
        }

        try {
            dimension.spawnParticle(particleType.particleId, spawnPos, this.molangVars);
        } catch {
            // Particle may not exist or location may be unloaded
        }
    }

    // Get all emitters near a location (for Aether Lens)
    getEmittersNear(location: Vector3, dimension: Dimension, radius: number): Vector3[] {
        const nearby: Vector3[] = [];
        for (const emitter of this.activeEmitters.values()) {
            if (emitter.dimension.id !== dimension.id) continue;

            const dx = emitter.location.x - location.x;
            const dy = emitter.location.y - location.y;
            const dz = emitter.location.z - location.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq <= radius * radius) {
                nearby.push(emitter.location);
            }
        }
        return nearby;
    }

    // Get active emitter count for debugging
    getActiveEmitterCount(): number {
        return this.activeEmitters.size;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var EmitterManager: _EmitterManager;
}

export default _EmitterManager;
