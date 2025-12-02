import { Dimension } from "@minecraft/server";

// This is set in main
declare global {
    // eslint-disable-next-line no-var
    var overworld: Dimension;
}

import "Utilities/DebugTimer";

import "Wrappers/V2";
import "Wrappers/V3";

import "Store/World/WorldStore";
import "Utilities/BroadcastUtil";
import "Utilities/ControlsUtil";
import "Utilities/EntityUtil";
import "Utilities/EventSubscriber";
import "Utilities/Filter";
import "Utilities/GenericBuffer";
import "Utilities/InventoryUtil";
import "Utilities/MathUtil";
import "Utilities/PlayersCache";
import "Utilities/PlayerSound";
import "Utilities/SpatialHashGrid2D";

import "Store/Entity/EntityStore";
