# Plan: Address Atmosphere+ UI/UX Feedback

This plan addresses 7 user feedback items: adjusting slider limits for offset/radius/lifetime, reconsidering the Aether Lens, adding shareable preset codes, implementing grayscale textures with smart color defaults, and brainstorming product name alternatives.

## Steps

1. **Increase Position Offset range** in `EmitterForms.ts` — Current range is -2.0 to 2.0 blocks. Expand to ±10 blocks (slider -100 to 100, divided by 10) to give meaningful movement.

2. **Increase Emission Radius limit** in `EmitterForms.ts` — Current max is 5 blocks. Expand to 20+ blocks (slider 0-80, divided by 4 = 0-20 blocks) for larger ambient effects.

3. **Increase Particle Lifetime limit** in `EmitterForms.ts` — Current max is 10 seconds. Expand to 30+ seconds (slider 1-60, divided by 2 = 0.5-30s) for slow effects like falling leaves.

4. **Remove Aether Lens item** — Delete `aether_lens.json`, remove references from `CustomComponents.ts`, and add visibility logic when holding an Atmosphere Emitter block (same as Tuner Wand).

5. **Implement shareable preset codes** in `SavedCreations.ts` — Add `exportToCode(config)` and `importFromCode(code)` functions using Base64-encoded JSON, plus UI buttons in the save/load form.

6. **Convert particle textures to grayscale** in `RP/textures/` — Make all 16 texture sprites white/gray so tinting works universally, then add a `getDefaultColor(textureId)` function in `TextureAtlas.ts` to auto-set colors (e.g., Leaf → Green).

## Further Considerations

1. **New Product Name** — Options: "Particle Studio" / "Aura Crafter" / "Vibe Engine" / "Ambient Forge" / "Particle Playground" / "Aether Emitter" — which resonates best with "DIY particle emitter"?

2. **Code format for presets** — Use compact Base64 JSON, or a custom alphanumeric format (shorter but less flexible)? Base64 is ~200-400 chars, custom could be ~50-100.

3. **Grayscale texture default colors** — Should selecting a texture auto-change both start AND end colors, or just start color? (Recommend: both, user can edit after)

---

## Current Limits Reference

| Parameter | Current Range | Display Range | Notes |
|-----------|---------------|---------------|-------|
| Position Offset X/Y/Z | -2.0 to 2.0 blocks | -20 to 20 (x10) | Step: 0.1 |
| Emission Radius | 0 to 5.0 blocks | 0 to 20 (x4) | Step: 0.25 |
| Particle Lifetime | 0.5 to 10 seconds | 1 to 20 (x2) | Step: 0.5s |
| Spawn Rate | 1 to 50/second | 1 to 50 | Direct |
| Saved Creations | Max 20 | - | Per world |
| Visibility Range | 32 blocks | - | For Aether Lens/Tuner Wand |

---

## Detailed Feedback Items

### 1. Position Offset (x10 confusion)
**Problem:** The x10 label is confusing, and the range (-2 to 2 blocks) is too small.
**Solution:** 
- Rename label so that x10 means multiplying/dividing by 10 block units
- Expand range to ±10 blocks (slider -10 to 10)

### 2. Emission Radius Too Limiting
**Problem:** Max 5 blocks is too small for ambient effects.
**Solution:** Expand to 20+ blocks for large-area effects like forest ambiance.

### 3. Particle Lifetime Too Short
**Problem:** Max 10 seconds doesn't support slow effects like falling leaves.
**Solution:** Expand to 30+ seconds.

### 4. Product Name ("Atmosphere+")
**Problem:** Name suggests volumetrics/lighting, not particle emitters.
**Solution:**
Rename addon to DIY Particles

### 5. Aether Lens Redundancy
**Problem:** Extra step to equip, needs crafting recipe, redundant with Tuner Wand.
**Solution:** 
- Remove Aether Lens entirely
- Add visibility when holding Universal Emitter block (in addition to Tuner Wand)

### 6. Shareable Preset Codes
**Problem:** No way to share presets online.
**Solution:** 
- Add "Export Code" button → generates Base64 string
- Add "Import Code" button → text field to paste code
- Similar to retro game save codes

### 7. Grayscale Textures + Smart Color Defaults
**Problem:** Colored textures don't work well with tinting.
**Solution:**
- Convert all 16 textures to grayscale/white using imagemagick
- When selecting a texture, auto-set a sensible default color:
  - Leaf → Green
  - Flame → Orange
  - Snowflake → Cyan/White
  - Smoke Puff → Gray
  - etc.
- User can still edit colors after selection

At the end, create a very brief summary document outlining these changes for future reference.