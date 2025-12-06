// Particle type definitions for DIY Particles

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
    {
        id: "dripping_water",
        name: "Dripping Water",
        category: "elemental",
        particleId: "ns_ptl:dripping_water",
        description: "Water droplets",
    },
    { id: "rising_steam", name: "Rising Steam", category: "elemental", particleId: "ns_ptl:rising_steam", description: "Steam puffs" },
    {
        id: "falling_leaves_oak",
        name: "Falling Leaves (Oak)",
        category: "elemental",
        particleId: "ns_ptl:falling_leaves_oak",
        description: "Oak leaves",
    },
    {
        id: "falling_leaves_autumn",
        name: "Falling Leaves (Autumn)",
        category: "elemental",
        particleId: "ns_ptl:falling_leaves_autumn",
        description: "Autumn leaves",
    },
    {
        id: "falling_leaves_cherry",
        name: "Falling Leaves (Cherry)",
        category: "elemental",
        particleId: "ns_ptl:falling_leaves_cherry",
        description: "Cherry blossoms",
    },
    { id: "fireflies", name: "Fireflies", category: "elemental", particleId: "ns_ptl:fireflies", description: "Glowing dots" },
    { id: "ocean_spray", name: "Ocean Spray", category: "elemental", particleId: "ns_ptl:ocean_spray", description: "Splash effects" },
    {
        id: "electricity_arc",
        name: "Electricity Arc",
        category: "industrial",
        particleId: "ns_ptl:electricity_arc",
        description: "Electric sparks",
    },
    { id: "black_smoke", name: "Black Smoke", category: "industrial", particleId: "ns_ptl:black_smoke", description: "Dark plumes" },
    { id: "welding_sparks", name: "Sparks", category: "industrial", particleId: "ns_ptl:welding_sparks", description: "Orange sparks" },
    {
        id: "radiation_glow",
        name: "Radiation Glow",
        category: "industrial",
        particleId: "ns_ptl:radiation_glow",
        description: "Green glow",
    },
    { id: "watcher_eyes", name: "The Watchers", category: "spooky", particleId: "ns_ptl:watcher_eyes", description: "Blinking eyes" },
    { id: "void_tendrils", name: "Void Tendrils", category: "spooky", particleId: "ns_ptl:void_tendrils", description: "Dark particles" },
    { id: "floating_runes", name: "Runes", category: "spooky", particleId: "ns_ptl:floating_runes", description: "Floating characters" },
    { id: "ghost_orb", name: "Ghost Orb", category: "spooky", particleId: "ns_ptl:ghost_orb", description: "Will-o'-the-wisp" },
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
