# Atmosphere Atlas Texture

This folder contains `atmosphere_atlas.png` - a 128x128 pixel sprite sheet containing 16 particle textures arranged in a 4x4 grid (32x32 pixels each).

Generated using PixelLab AI pixel art generation.

## Texture Layout

The atlas is organized as follows (4 columns x 4 rows):

| Row | Col 0 (ID 0) | Col 1 (ID 1) | Col 2 (ID 2) | Col 3 (ID 3) |
|-----|--------------|--------------|--------------|--------------|
| 0   | Soft Circle  | Star         | Heart        | Skull        |
| 1   | Leaf (ID 4)  | Smoke (ID 5) | Spark (ID 6) | Bubble (ID 7)|
| 2   | Rune (ID 8)  | Flame (ID 9) | Snowflake (10)| Raindrop (11)|
| 3   | Dust (ID 12) | Magic Orb (13)| Eye (ID 14) | Glint (ID 15)|

## Texture Descriptions

- **ID 0 - Soft Circle**: A soft, white radial gradient circle. Used for "Basic Color" mode.
- **ID 1 - Star**: A 4-pointed or 5-pointed star shape.
- **ID 2 - Heart**: A heart symbol.
- **ID 3 - Skull**: A small skull icon (for spooky effects).
- **ID 4 - Leaf**: A simple leaf shape.
- **ID 5 - Smoke Puff**: A soft, cloud-like smoke texture.
- **ID 6 - Spark**: A bright, sharp spark/glint.
- **ID 7 - Bubble**: A translucent bubble with highlight.
- **ID 8 - Rune**: An enchanting-style rune character.
- **ID 9 - Flame**: A small flame texture.
- **ID 10 - Snowflake**: A snowflake crystal pattern.
- **ID 11 - Raindrop**: A teardrop/raindrop shape.
- **ID 12 - Dust**: A small dust particle (irregular shape).
- **ID 13 - Magic Orb**: A glowing magical orb.
- **ID 14 - Eye**: A pair of eyes or single eye (for "The Watchers").
- **ID 15 - Glint**: A lens flare / light glint.

## Technical Requirements

- **Size**: 128x128 pixels total (4x4 grid of 32x32 sprites)
- **Format**: PNG with transparency (alpha channel)
- **Colors**: White/light colors (tinting is applied via Molang)
- **Background**: Transparent

## UV Calculation

The master particle uses this formula to select textures:

```text
uv_x = (texture_id % 4) * 32
uv_y = floor(texture_id / 4) * 32
```

For example:

- ID 0: UV (0, 0)
- ID 5: UV (32, 32)
- ID 15: UV (96, 96)
