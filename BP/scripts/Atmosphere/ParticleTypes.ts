// Particle type definitions for the Atmosphere+ addon
// Each particle has an ID, display name, category, and the particle effect identifier

export interface ParticleType {
    id: string;
    name: string;
    category: ParticleCategory;
    particleId: string;
    description: string;
}

export type ParticleCategory = "elemental" | "industrial" | "spooky";

export const ParticleCategories: Record<ParticleCategory, string> = {
    elemental: "§aElemental & Nature",
    industrial: "§6Industrial & Tech",
    spooky: "§5Spooky & Magic",
};

export const ParticleTypes: ParticleType[] = [
    // Category A: Elemental & Nature
    {
        id: "dripping_water",
        name: "Dripping Water",
        category: "elemental",
        particleId: "ns_ptl:dripping_water",
        description: "Heavy water droplets for sewers and caves",
    },
    {
        id: "rising_steam",
        name: "Rising Steam",
        category: "elemental",
        particleId: "ns_ptl:rising_steam",
        description: "White puffs for hot springs, vents, or chimneys",
    },
    {
        id: "falling_leaves_oak",
        name: "Falling Leaves (Oak)",
        category: "elemental",
        particleId: "ns_ptl:falling_leaves_oak",
        description: "Green oak leaves drifting down",
    },
    {
        id: "falling_leaves_autumn",
        name: "Falling Leaves (Autumn)",
        category: "elemental",
        particleId: "ns_ptl:falling_leaves_autumn",
        description: "Orange and red autumn leaves",
    },
    {
        id: "falling_leaves_cherry",
        name: "Falling Leaves (Cherry)",
        category: "elemental",
        particleId: "ns_ptl:falling_leaves_cherry",
        description: "Pink cherry blossom petals",
    },
    {
        id: "fireflies",
        name: "Fireflies",
        category: "elemental",
        particleId: "ns_ptl:fireflies",
        description: "Bioluminescent dots for forests",
    },
    {
        id: "ocean_spray",
        name: "Ocean Spray",
        category: "elemental",
        particleId: "ns_ptl:ocean_spray",
        description: "Low, horizontal splash effects",
    },

    // Category B: Industrial & Tech
    {
        id: "electricity_arc",
        name: "Electricity Arc",
        category: "industrial",
        particleId: "ns_ptl:electricity_arc",
        description: "Blue/yellow sparks for electrical effects",
    },
    {
        id: "black_smoke",
        name: "Black Smoke",
        category: "industrial",
        particleId: "ns_ptl:black_smoke",
        description: "Heavy dark plumes for factories or fires",
    },
    {
        id: "welding_sparks",
        name: "Sparks",
        category: "industrial",
        particleId: "ns_ptl:welding_sparks",
        description: "Bright orange welding sparks",
    },
    {
        id: "radiation_glow",
        name: "Radiation Glow",
        category: "industrial",
        particleId: "ns_ptl:radiation_glow",
        description: "Sickly green pulsing aura",
    },

    // Category C: Spooky & Magic
    {
        id: "watcher_eyes",
        name: "The Watchers",
        category: "spooky",
        particleId: "ns_ptl:watcher_eyes",
        description: "Glowing eyes that blink in darkness",
    },
    {
        id: "void_tendrils",
        name: "Void Tendrils",
        category: "spooky",
        particleId: "ns_ptl:void_tendrils",
        description: "Dark purple particles rising from the floor",
    },
    {
        id: "floating_runes",
        name: "Runes",
        category: "spooky",
        particleId: "ns_ptl:floating_runes",
        description: "Enchanting characters floating upward",
    },
    {
        id: "ghost_orb",
        name: "Ghost Orb",
        category: "spooky",
        particleId: "ns_ptl:ghost_orb",
        description: "A single wandering will-o'-the-wisp",
    },
];

export const ParticleTypesMap = new Map<string, ParticleType>(ParticleTypes.map((p) => [p.id, p]));

export function getParticlesByCategory(category: ParticleCategory): ParticleType[] {
    return ParticleTypes.filter((p) => p.category === category);
}

export const DirectionTypes = ["up", "down", "omni"] as const;
export type DirectionType = (typeof DirectionTypes)[number];

export const DirectionLabels: Record<DirectionType, string> = {
    up: "Up",
    down: "Down",
    omni: "Omni-directional",
};
