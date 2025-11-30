import { Dimension, world } from "@minecraft/server";

declare global {
    // eslint-disable-next-line no-var
    var overworld: Dimension;
}
globalThis.overworld = world.getDimension("overworld");

import "Utilities/DebugTimer";

import "Utilities/ConfigFactory";

import "Store/World/WorldStore";
import "Utilities/BroadcastUtil";
import "Utilities/Clipboard";
import "Utilities/CommandUtil";
import "Utilities/Config";
import "Utilities/ControlsUtil";
import "Utilities/EntityUtil";
import "Utilities/EventEmitter";
import "Utilities/EventSubscriber";
import "Utilities/Filter";
import "Utilities/GenericBuffer";
import "Utilities/InventoryUtil";
import "Utilities/MathUtil";
import "Utilities/PlayersCache";
import "Utilities/PlayerSound";
import "Utilities/ScriptEventListener";
import "Utilities/SpatialHashGrid2D";

import "Store/Entity/EntityStore";

import "Game/GameData";
