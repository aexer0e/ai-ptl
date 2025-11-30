# Minecraft Bedrock Addon Development Guide

This is a **Minecraft Bedrock Edition addon** built with TypeScript, using the `@minecraft/server` API. The project uses bridge. compiler with custom plugins for entity/item components and TypeScript transpilation.

## Architecture & Core Systems

### Global Utility Pattern
Most utilities are exposed as **global variables** (not imports). Classes export as `_ClassName` then assign to `globalThis`:

```typescript
class _V3 { ... }
declare global { var V3: Omit<typeof _V3, "prototype">; }
globalThis.V3 = _V3;
```

Access utilities directly: `new V3`, `EntityUtil.isValid()`, `BroadcastUtil.debug()` - no imports needed. See `BP/scripts/GlobalVars.ts` for initialization order.

### Initialization Flow (BP/scripts/Main.ts)
1. `GlobalVars.ts` imports all utilities to register globals
2. `Main.init()` runs on script load then starts `onTick()` interval
3. `worldLoad` event initializes systems in order

### Event System (EventSubscriber)
Centralized event wrapper to manage subscriptions with IDs. Use instead of raw Minecraft events:

```typescript
EventSubscriber.subscribe("WorldAfterEvents", "itemUse", (e) => { ... });
```

### Entity Prototypes (BP/scripts/Prototype/)
Extensions to Minecraft's `Entity` class:
- `entity.valid` - safe `isValid` check
- `entity.try()` - returns entity or null
- `entity.getMobComponent("ComponentName")` - get custom mob component instance

### Custom Component System
- **MobComponentManager**: Registers TypeScript classes to entities based on `EntityTypes` property
  - Components in `BP/scripts/MobComponents/MobComponents/` extend base `MobComponent`
  - Auto-attached when entities spawn within 64 blocks of a player
  - Access via `entity.getMobComponent("ComponentName")`

### Data Storage
- **EntityStore**: Persistent (dynamic properties) and temporary (in-memory) entity data
  ```typescript
  EntityStore.get(entity, "propertyName") // reads/caches dynamic properties
  EntityStore.set(entity, "propertyName", value)
  EntityStore.temp.get(entity, "tempProperty") // non-persistent storage
  ```
- Define schemas in `BP/scripts/Store/Entity/Properties.ts`

### Custom Commands
- Triggered via `/scriptevent ns_tpl:debug <command> <args>`
- Define in `BP/scripts/CustomCommands/Commands/` implementing `Command` interface
- Register in `Commands/index.ts`

### V3 Wrapper
Custom Vector3 class with utilities. Use `new V3(x, y, z)` or `V3.grid(x, y, z)` (multiplies by 16).

## Workflow & Commands

### Automated Testing (GameTest)
We use a Docker-based test runner (`test-runner.js`) for rapid iteration.

**Usage:**
1.  **Verify:** Run `node test-runner.js` in terminal.
    - **Hot Mode:** If container `mc-gametest-runner` is running, it reloads scripts (`/reload`) and runs tests immediately (~3s).
    - **Cold Mode:** If stopped, it starts the container (~20s).
2.  **Troubleshooting:**
    - **Manifest Changes:** If `manifest.json` is modified, run `docker restart mc-gametest-runner` manually.
    - **Logs:** The runner handles log streaming. Do not check `docker logs` manually.
    - **Environment:** Requires `server-data/worlds/BetaTestWorld` seeded with Beta APIs enabled.

### Development Commands
```powershell
npm run lint # TypeScript check + ESLint + Prettier
```

## Project Structure

- **BP/scripts/**: TypeScript source (compiled to BP by bridge.)
  - `Main.ts` - entry point
  - `GlobalVars.ts` - imports all global utilities
  - `Utilities/` - global utility classes
  - `MobComponents/` - custom entity behavior components
  - `CustomCommands/` - debug commands
  - `Game/` - game data, events definitions
  - `Store/` - entity/world storage systems
  - `Wrappers/` - V2, V3 vector classes
  - `Prototype/` - Entity/System extensions

- **config.json** - bridge. project config, compiler plugins, experimental toggles
- **example_addons/** - Reference projects (mc-order, mc-sky, mc-zenith). Use for learning and reference.

## Conventions

1. **No imports for globals**: Utilities like `EntityUtil`, `BroadcastUtil` are accessed globally
2. **Manager pattern**: Systems have `static init()` called from `Main.ts` in specific order
3. **Component registration**: MobComponents specify `static EntityTypes: string[]` to auto-attach
4. **Namespace prefix**: `ns_tpl` for this project (items, events, etc. use `ns_tpl:` prefix)
5. **TypeScript target**: ES2023 (QuickJS runtime in Minecraft)
6. **baseUrl**: `./BP/scripts` - import paths relative to scripts folder

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

When implementing Bedrock-specific features, search this documentation for patterns and examples.
