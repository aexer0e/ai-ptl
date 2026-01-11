# Atmosphere Atlas Texture

This folder contains `atmosphere_atlas.png` - a 128x128 pixel sprite sheet containing 16 particle textures arranged in a 4x4 grid (32x32 pixels each).

Generated using PixelLab AI pixel art generation.

## Texture Layout

The atlas is organized as follows (4 columns x 4 rows):

| Row | Col 0 (ID 0) | Col 1 (ID 1) | Col 2 (ID 2) | Col 3 (ID 3) |
|-----|--------------|--------------|--------------|--------------|
| 0   | Soft Circle  | Ant Confetti | Barrier      | Cobweb       |
| 1   | Cookie (ID 4)| Diamond (ID 5)| Eye of Ender (ID 6)| Feather (ID 7)|
| 2   | Gold (ID 8)  | Kelp (ID 9)  | Paper (ID 10)| Poison (ID 11)|
| 3   | Steak (ID 12)| Stick (ID 13)| Tumbleweed (ID 14)| Wind Charged (ID 15)|

## Texture Descriptions

- **ID 0 - Soft Circle**: A soft, white radial gradient circle. Used for "Basic Color" mode.
- **ID 1 - Ant Confetti**: Confetti particle effect.
- **ID 2 - Barrier**: Barrier block particle.
- **ID 3 - Cobweb**: Cobweb/spider web texture.
- **ID 4 - Cookie**: Cookie item particle.
- **ID 5 - Diamond**: Diamond gem particle.
- **ID 6 - Eye of Ender**: Eye of Ender particle.
- **ID 7 - Feather**: Falling feather particle.
- **ID 8 - Gold**: Gold ingot/nugget particle.
- **ID 9 - Kelp**: Kelp/seaweed particle.
- **ID 10 - Paper**: Paper/map particle.
- **ID 11 - Poison**: Poison effect particle.
- **ID 12 - Steak**: Steak/food particle.
- **ID 13 - Stick**: Stick/twig particle.
- **ID 14 - Tumbleweed**: Rolling tumbleweed particle.
- **ID 15 - Wind Charged**: Wind charge effect particle.

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
