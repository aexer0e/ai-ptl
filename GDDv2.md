# GAME DESIGN DOCUMENT

**Project:** DIY Particles (The Particle Architect)  
**Version:** 3.0 (Texture Update)  
**Target Platform:** Minecraft Bedrock Edition

---

## 1. Executive Summary

DIY Particles is a creative utility Add-On that transforms particles from static visual effects into a programmable building material. Instead of offering a fixed catalog of effects, it provides players with a "Particle Composer"—an in-game interface to design, tune, and save their own unique environmental effects using a single, highly mutable emitter block.

**Core Value Proposition:** *"Infinite atmosphere, one block."*

---

## 2. Core Mechanics

### 2.1 The Emitter System

- **The Block:** A single block entity called the `atmosphere:emitter`.
- **Visibility:**
  - *Default:* Invisible and passable (no collision).
  - *Edit Mode:* Renders a wireframe box when the player holds the "Tuner Wand" or wears the "Aether Lens".
- **Function:** It plays the `atmosphere:master_particle` and injects variables into it based on the player's configuration.

### 2.2 The Toolset

1. **The Aether Lens (Helmet):**
   - Allows the player to see all invisible emitters within a 32-block radius.
   - Essential for debugging and removing misplaced nodes.

2. **The Tuner Wand (Item):**
   - Right-Click/Tap on an Emitter to open the "Particle Composer UI".
   - Sneak + Right-Click to Copy/Paste settings between emitters.

---

## 3. The Particle Composer (UI)

When interacting with an Emitter, the player is presented with a Scripting API Form containing four tabs.

### 3.1 Configurable Parameters

#### Tab A: Appearance (Style & Color)

> **Note:** The "Render Style" dropdown changes which options are available.

| # | Parameter | Description |
|---|-----------|-------------|
| 1 | **Render Style** (Dropdown) | "Basic Color": Uses a generic soft circle, unlocks RGB sliders. "Preset Texture": Unlocks the Texture ID slider. |
| 2 | **Texture ID** (Slider 0-15) | Visible only in "Preset Texture" mode. Selects a sprite from the Atlas (e.g., Star, Heart, Skull, Leaf). |
| 3 | **Tint Mode** (Toggle) | Visible only in "Preset Texture" mode. OFF: Uses original texture colors. ON: Tints texture with RGB sliders. |
| 4 | **Color: Red** (Slider 0.0 - 1.0) | Red channel value. |
| 5 | **Color: Green** (Slider 0.0 - 1.0) | Green channel value. |
| 6 | **Color: Blue** (Slider 0.0 - 1.0) | Blue channel value. |
| 7 | **Alpha / Opacity** (Slider 0.0 - 1.0) | Transparency level. |
| 8 | **Blending Mode** (Dropdown) | Normal (Alpha) vs. Additive (Glowing/Bright). |
| 9 | **Size Start** (Slider 0.1 - 5.0) | Size of particle when it spawns. |
| 10 | **Size End** (Slider 0.0 - 5.0) | Size of particle when it dies. |

#### Tab B: Physics & Motion

| # | Parameter | Description |
|---|-----------|-------------|
| 1 | **Speed** (Slider 0.0 - 2.0) | Initial velocity. |
| 2 | **Gravity** (Slider -2.0 - 2.0) | Positive falls (water), Negative floats (smoke). |
| 3 | **Drag** (Slider 0.0 - 10.0) | Air resistance. High drag stops particles quickly. |
| 4 | **Direction Mode** (Dropdown) | Vector (Specific direction) or Radial (Explosion). |
| 5 | **Vector X** (Slider -1.0 - 1.0) | X-axis direction component. |
| 6 | **Vector Y** (Slider -1.0 - 1.0) | Y-axis direction component. |
| 7 | **Vector Z** (Slider -1.0 - 1.0) | Z-axis direction component. |
| 8 | **Collision** (Toggle) | If true, particles bounce/die on blocks. |

#### Tab C: Spawning Rules

| # | Parameter | Description |
|---|-----------|-------------|
| 1 | **Spawn Rate** (Slider 1 - 50) | Particles spawned per second. |
| 2 | **Particle Lifetime** (Slider 0.5s - 10s) | How long a single particle exists. |
| 3 | **Emission Radius** (Slider 0 - 5.0) | Spread of source (0=Point, 5=Large Area). |
| 4 | **Shape** (Dropdown) | Sphere, Box, or Disc. |

#### Tab D: Advanced (Math)

| # | Parameter | Description |
|---|-----------|-------------|
| 1 | **Spin Speed** (Slider) | Rotation of the particle texture. |
| 2 | **Face Camera** (Toggle) | Billboard mode (always face player) vs. Flat. |
| 3 | **Pulse** (Toggle) | Varies opacity over time (sine wave) for "breathing" effects. |

---

## 4. Technical Architecture (The "One File" System)

### 4.1 The "Master Atlas" Texture

The texture file `particles/atmosphere_atlas.png` is a grid containing 16 sprites:

- **Index 0:** Soft White Circle (Used for "Basic Color" mode).
- **Index 1-15:** Preset Textures (Stars, Smoke, Runes, Glint, Bubbles, etc.).

### 4.2 The Master JSON (`atmosphere:master_particle`)

This file defines EVERY possible component, but controls them via Molang.

**Logic for Render Styles:**

The Scripting API handles the logic before sending data to the particle:

- If "Basic Color" is chosen: Script sends `variable.texture_id = 0`.
- If "Preset Texture" (Tint OFF) is chosen: Script sends pure white color (1.0, 1.0, 1.0) to preserve original texture look.

### 4.3 The Scripting Bridge (GameTest)

When the Emitter ticks, the script:

1. Fetches the saved data from the block (Dynamic Properties).
2. Creates a `new MolangVariableMap()`.
3. Injects the user's settings into the variables.
4. Spawns the `atmosphere:master_particle` at the block location using the map.

---

## 5. Survival Integration

Since players can make *anything* with one block, the block is designed to be moderately expensive.

| Item | Recipe | Notes |
|------|--------|-------|
| **Atmosphere Emitter** | 4 Iron Ingots (Corners), 4 Glass Panes (Sides), 1 Eye of Ender (Center) | *"An eye that projects visions of the mind."* |
| **Tuner Wand** | 1 Blaze Rod, 1 Amethyst Shard, 1 Copper Ingot | — |

---

## 6. Future Scope

- **Keyframes:** Allow users to set a "Start Color" and "End Color" and interpolate between them.
- **Presets:** A "Copy Code" button in the UI that generates a text string (like deck codes in card games) so players can share particle settings online.
