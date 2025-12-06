// DIY Particles Module Index
// "Infinite atmosphere, one block."
//
// The Particle Composer system allows players to design, tune, and save
// their own unique environmental effects using a single, highly mutable emitter block.
//
// Key Components:
// - EmitterConfig.ts: Complete configuration types and defaults
// - ParticleComposer.ts: 4-tab UI system (Appearance, Physics, Spawning, Advanced)
// - master_particle: The single particle file controlled via MolangVariableMap
//
// Particles are handled via block custom component onTick (see Components/CustomComponents.ts)

export * from "./EmitterConfig";
export { default as ParticleComposer } from "./ParticleComposer";
