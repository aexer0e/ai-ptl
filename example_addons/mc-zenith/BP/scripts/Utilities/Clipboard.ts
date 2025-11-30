import { ItemStack, MolangVariableMap, Player, Vector3, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import V3 from "Wrappers/V3";

enum CopyVolumeMode {
    V3,
    Grid,
    Plain,
}
enum CopyBlockMode {
    V3,
    Grid,
    Plain,
    XYGrid,
    XYGridYPlusOne,
    PlainYPlusOne,
    Vector3,
}

const CopySettingsTemplate = {
    volume: {
        [CopyVolumeMode.V3]: (min: V3, max: V3) => `min: new V3(${min.x}, ${min.y}, ${min.z}), max: new V3(${max.x}, ${max.y}, ${max.z})`,
        [CopyVolumeMode.Grid]: (min: V3, max: V3) =>
            `min: V3.grid(${min.x}, ${min.y}, ${min.z}), max: V3.grid(${max.x}, ${max.y}, ${max.z})`,
        [CopyVolumeMode.Plain]: (min: V3, max: V3) => `${min.x} ${min.y} ${min.z} ${max.x} ${max.y} ${max.z}`,
    },
    block: {
        [CopyBlockMode.V3]: (location: V3) => `new V3(${location.x}, ${location.y}, ${location.z})`,
        [CopyBlockMode.Grid]: (location: V3) => `V3.grid(${location.x}, ${location.y}, ${location.z})`,
        [CopyBlockMode.Plain]: (location: V3) => `${location.x} ${location.y} ${location.z}`,
        [CopyBlockMode.XYGrid]: (location: V3) => `new V3(${location.x + 0.5}, ${location.y}, ${location.z + 0.5})`,
        [CopyBlockMode.XYGridYPlusOne]: (location: V3) => `new V3(${location.x + 0.5}, ${location.y + 1}, ${location.z + 0.5})`,
        [CopyBlockMode.PlainYPlusOne]: (location: V3) => `${location.x} ${location.y + 1} ${location.z}`,
        [CopyBlockMode.Vector3]: (location: V3) => `{ x: ${location.x}, y: ${location.y}, z: ${location.z} }`,
    },
};

const VolumesLabels = Object.values(CopySettingsTemplate.volume).map((e) => e(new V3(1, 2, 3), new V3(7, 8, 9)));
const BlocksLabels = Object.values(CopySettingsTemplate.block).map((e) => e(new V3(1, 2, 3)));

/**
 * Clipboard utility for copying and visualizing block and volume locations in the world.
 * Provides methods for copying block/volume data, showing settings UI, and drawing debug particles.
 */
export default class Clipboard {
    private static readonly clipboardItemEnabled = false;
    private static readonly clipboardItem = new ItemStack("gm1_common:clipboard");
    static tempLocation: null | V3 = null;
    static cache: string[] = [];
    static cacheEnabled = false;
    static settings = {
        copyVolumeModeSelected: CopyVolumeMode.V3,
        copyBlockModeSelected: CopyBlockMode.V3,
        leftClickCopiesBlock: true,
        rightClickCopiesBlock: true,
    };

    /**
     * Initializes clipboard event listeners and loads settings from WorldStore.
     */
    static init() {
        if (!this.clipboardItemEnabled) return;
        EventSubscriber.subscribe("WorldAfterEvents", "itemUse", (eventData) => {
            if (eventData.itemStack.typeId !== this.clipboardItem.typeId) return;

            if (eventData.source.isSneaking) {
                this.openSettings(eventData.source);
                return;
            }

            const raycastResult = eventData.source.getBlockFromViewDirection({ maxDistance: 10, includePassableBlocks: true });
            const location = new V3(raycastResult?.block?.location || eventData.source.location).floor();
            // this.copyVolume(location);
            this.settings.leftClickCopiesBlock ? this.copyLocation(location) : this.copyVolume(location);
        });

        this.settings.copyVolumeModeSelected = WorldStore.get("CbCopyVolumeModeSelected");
        this.settings.copyBlockModeSelected = WorldStore.get("CbCopyBlockModeSelected");
        this.settings.leftClickCopiesBlock = WorldStore.get("CbLeftClickCopiesBlock");
        this.settings.rightClickCopiesBlock = WorldStore.get("CbRightClickCopiesBlock");

        EventSubscriber.subscribe("WorldBeforeEvents", "playerBreakBlock", (eventData) => {
            if (eventData.itemStack?.typeId !== this.clipboardItem.typeId) return;

            eventData.cancel = true;
            const location = new V3(eventData.block.location).floor();
            this.settings.rightClickCopiesBlock ? this.copyLocation(location) : this.copyVolume(location);
        });
    }

    /**
     * Opens the clipboard settings UI for the given player.
     * @param player The player to show the settings form to.
     */
    static openSettings(player: Player) {
        const form = new ModalFormData().title("Configurables");
        form.dropdown("Copy Location", VolumesLabels, this.settings.copyVolumeModeSelected);
        form.dropdown("Copy Block", BlocksLabels, this.settings.copyBlockModeSelected);
        form.toggle("Cache", this.cacheEnabled);
        form.toggle("Left Click Copies Block/Volume", this.settings.leftClickCopiesBlock);
        form.toggle("Right Click Copies Block/Volume", this.settings.rightClickCopiesBlock);
        form.show(player).then((formData) => {
            if (!formData.formValues) return;
            this.settings.copyBlockModeSelected = formData.formValues[1] as number;
            this.settings.copyVolumeModeSelected = formData.formValues[0] as number;
            this.cacheEnabled = formData.formValues[2] as boolean;
            this.settings.leftClickCopiesBlock = formData.formValues[3] as boolean;
            this.settings.rightClickCopiesBlock = formData.formValues[4] as boolean;
            WorldStore.set("CbCopyVolumeModeSelected", this.settings.copyVolumeModeSelected);
            WorldStore.set("CbCopyBlockModeSelected", this.settings.copyBlockModeSelected);
            WorldStore.set("CbLeftClickCopiesBlock", this.settings.leftClickCopiesBlock);
            WorldStore.set("CbRightClickCopiesBlock", this.settings.rightClickCopiesBlock);
            if (!this.cacheEnabled) this.cache = [];
        });
        return;
    }

    /**
     * Copies a single block location to the clipboard in the selected format.
     * @param location The block location to copy.
     */
    static copyLocation(location: V3) {
        const text = CopySettingsTemplate.block[this.settings.copyBlockModeSelected](location);

        if (
            this.settings.copyBlockModeSelected === CopyBlockMode.XYGridYPlusOne ||
            this.settings.copyBlockModeSelected === CopyBlockMode.PlainYPlusOne
        ) {
            location.addSelf(0, 1, 0);
        }

        this.toClipboard(text);
        system.run(() => {
            const molang = new MolangVariableMap();
            molang.setFloat("variable.color", 0);
            molang.setFloat("variable.scale", 3);
            this.drawParticle(location.toGrid().add(0, 0.5, 0), molang);
        });
    }

    /**
     * Copies a volume (cuboid) selection to the clipboard in the selected format.
     * @param location The second corner of the volume.
     */
    static copyVolume(location: V3) {
        if (!this.tempLocation) {
            this.tempLocation = new V3(location);
        } else {
            const oldMin = this.tempLocation;
            const oldMax = location;
            const { min, max } = V3.cleanVolume({ min: oldMin, max: oldMax });

            const text = CopySettingsTemplate.volume[this.settings.copyVolumeModeSelected](min, max);

            this.toClipboard(text);
            system.run(() => {
                this.drawVolumeOutline({ min: min.toGrid(), max: max.toGrid() });
            });
            this.tempLocation = null;
        }
    }

    /**
     * Copies the given text to the clipboard, using cache if enabled.
     * @param text The text to copy.
     */
    static toClipboard(text: string) {
        BroadcastUtil.debug("copying to clipboard: " + text);
        if (this.cacheEnabled) {
            this.cache.push(text);
            BroadcastUtil.clipboard(this.cache.join("\n"));
        } else {
            BroadcastUtil.clipboard(text);
        }
    }

    /**
     * Draws a particle outline around the given volume for visualization.
     * @param volume The min/max corners of the volume.
     * @param color Optional color index for the particles.
     */
    private static drawVolumeOutline(volume: { min: V3; max: V3 }, color = 1) {
        const { min, max } = volume;
        const playerPos = new V3(
            EntityUtil.getEntities({ type: "minecraft:player", closest: 1, location: V3.getCenterOfVolume(volume) }, overworld)[0].location
        );
        const molang = new MolangVariableMap();
        molang.setFloat("variable.color", color);

        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                for (let z = min.z; z <= max.z; z++) {
                    if (x == min.x || x == max.x || y == min.y || y == max.y || z == min.z || z == max.z) {
                        const pos = new V3(x, y + 0.5, z);
                        if (pos.distanceTo(playerPos) > 30) continue;
                        this.drawParticle(pos, molang);
                    }
                }
            }
        }
    }

    /**
     * Spawns a debug particle at the given position.
     * @param pos The position to spawn the particle.
     * @param molang Optional Molang variable map for particle color/scale.
     */
    static drawParticle(pos: Vector3, molang?: MolangVariableMap) {
        if (molang) overworld.spawnParticle("gm1:static", pos, molang);
        else overworld.spawnParticle("gm1:static", pos);
    }

    /**
     * Draws a line of debug particles between two points.
     * @param start The start position.
     * @param end The end position.
     * @param step The distance between particles.
     * @param molang Optional Molang variable map for particle color/scale.
     */
    static drawLine(start: Vector3, end: Vector3, step = 0.8, molang?: MolangVariableMap) {
        const direction = new V3(end).subtractV3(start).normalize().multiply(step);
        const startV3 = new V3(start);
        for (let i = 0; i < startV3.distanceTo(end); i += step) {
            const pos = new V3(start).addV3(direction.multiply(i));
            if (molang) overworld.spawnParticle("aurora:pop", pos, molang);
            else overworld.spawnParticle("aurora:pop", pos);
        }
    }
}
