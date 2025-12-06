# GAME DESIGN DOCUMENT

**Project**: DIY Particles (The Particle Architect)

**Version**: 1.0

**Target Platform**: Minecraft Bedrock Edition

---

## 1. Executive Summary

**DIY Particles** is a utility-based decoration Add-On designed to fill a major gap in the Minecraft creative toolkit: the lack of dynamic, localized atmospheric effects. By introducing "Particle Emitters"—invisible blocks that spawn visual effects—players can move beyond static blocks and "paint" their builds with movement, such as leaking pipes, haunted auras, or crashing waves.

**Core Value Proposition:** "Don’t just build the structure; build the atmosphere."

---

## 2. Core Mechanics

### 2.1 The Emitter Block

The fundamental unit of the Add-On.

* **Placement:** Placed like a standard block.
* **State A (Default):** Invisible. No collision (players walk through it).
* **State B (Edit Mode):** Visible (translucent outline) when the player holds the **Aether Lens** or **Tuner Wand**.

### 2.2 The Toolset

* **The Aether Lens (Helmet/Goggles):**
  * *Function:* Renders a glowing bounding box around all placed Emitters within 20 blocks. Essential for locating invisible nodes.
* **The Tuner Wand (Item):**
  * *Function:* Right-click (or tap) an Emitter to open the Configuration UI.

---

## 3. The Particle Catalog

Emitters are categorized to assist the user in finding the right "vibe."

### Category A: Elemental & Nature

* **Dripping Water:** Heavy droplets (for sewers/caves) or fine mist.
* **Rising Steam:** White puffs for hot springs, vents, or chimneys.
* **Falling Leaves:** Variants for Oak (Green), Autumn (Orange), and Cherry (Pink).
* **Fireflies:** Bioluminescent dots moving erratically (for forests).
* **Ocean Spray:** Low, horizontal splash effects.

### Category B: Industrial & Tech

* **Electricity Arc:** Blue/Yellow sparks connecting two points.
* **Black Smoke:** Heavy, dark plumes for factories or fires.
* **Sparks:** Bright orange, short-lived welding sparks.
* **Radiation Glow:** Sickly green pulsing aura.

### Category C: Spooky & Magic

* **The Watchers:** Two glowing pixels (eyes) that blink and fade in darkness.
* **Void Tendrils:** Dark purple particles rising from the floor.
* **Runes:** Standard enchanting characters floating upward.
* **Ghost Orb:** A single, wandering will-o'-the-wisp.

---

## 4. UI & Customization (The "Tuner" Interface)

Interaction with the Emitter opens a **Scripting API Form**. This prevents inventory clutter by using one "Universal Emitter" block that can be changed via software.

**Configurable Parameters:**

1. **Effect Type:** Dropdown list (e.g., Smoke, Water, Fire).
2. **Density:** Slider (1 = Subtle, 10 = Intense). *Crucial for mobile performance.*
3. **Spread:** Slider (0 = Exact point, 3 = 3x3 Block Area).
4. **Direction:** Dropdown (Up, Down, Omni-directional/Explosion).
5. **Active State:** Toggle (Always On / Redstone Required).

---

## 5. Technical Implementation (Bedrock Edition)

### 5.1 Block Definitions (JSON)

* **Geometry:** Transparent 1x1 cube.
* **Material:** `alpha_test` (allows transparency).
* **Collision:** `false`.
* **Selection Box:** `true` (only clickable when visible/holding tool).

### 5.2 Scripting (GameTest Framework)

* **Event:** `world.beforeEvents.itemUseOn` handles the Tuner Wand interaction.
* **Persistence:** Use `block.getDynamicProperty()` to save the user's settings (particle type, density) directly to that specific block coordinate.
* **Ticking:** The script scans loaded Emitters and executes the `world.spawnParticle()` command based on the saved properties.

---

## 6. Survival Integration (Crafting Recipes)

**Universal Emitter:**

| Glass | Amethyst | Glass |
|-------|----------|-------|
| Iron  | Redstone | Iron  |
| Stone | Stone    | Stone |

**Tuner Wand:**

* Stick + Glowstone Dust + Echo Shard.

**Aether Lens:**

* Copper Ingot + Glass Pane + Phantom Membrane.

---

## 7. Future Roadmap (V2)

* **Sound Modules:** Invisible blocks that emit looped .ogg audio (wind, machinery hum).
* **Biome Awareness:** Particles that auto-tint based on the biome they are placed in.
* **Redstone Integration:** Support for complex redstone pulse inputs to trigger particle "bursts."
