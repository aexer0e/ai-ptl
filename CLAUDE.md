# Minecraft Bedrock Addon Development Guide

This is a **Minecraft Bedrock Edition addon** built with TypeScript, using the `@minecraft/server` API. The project uses bridge. compiler with custom plugins for entity/item components and TypeScript transpilation.

## Reference Documentation

The **Bedrock-OSS Wiki Docs** folder contains comprehensive Minecraft Bedrock addon documentation. Use this as a reference for:

- **entities/** - Entity JSON format, components, behaviors, spawn rules
- **blocks/** - Block components, states, permutations, custom blocks
- **items/** - Item components, custom items
- **scripting/** - Script API usage, events, examples
- **animation-controllers/** - Animation controller patterns
- **commands/** - Command syntax and usage
- **loot/** - Loot table format
- **particles/** - Particle effects
- **json-ui/** - UI customization
- **world-generation/** - Custom world generation

The **Particles Guide/** folder contains a detailed guide on creating custom particles in Minecraft Bedrock:

- `Intruduction To Particles.md` - Comprehensive particle system tutorial
- `particles_example/` - Example particle files for reference

## Example Addons

**example_addons/** - Reference projects (mc-order, mc-sky, mc-zenith). Use for learning and reference.

## Scripts Architecture

See **[scripts-instructions.md](.github/scripts-instructions.md)** for detailed documentation on the TypeScript codebase architecture, including global utilities, event systems, entity components, and conventions.
