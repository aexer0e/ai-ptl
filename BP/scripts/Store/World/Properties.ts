import { MobComponentWorldStores } from "MobComponents/MobComponents/index";
import { TriggerWorldStores } from "Triggers/Triggers/index";

// Emitter location entry: "dimensionId:x,y,z"
type EmitterLocationKey = string;

export default {
    ...MobComponentWorldStores,
    ...TriggerWorldStores,
    CutsceneDebug: false as boolean,
    CbCopyVolumeModeSelected: 0 as number,
    CbCopyBlockModeSelected: 0 as number,
    CbLeftClickCopiesBlock: false as boolean,
    CbRightClickCopiesBlock: false as boolean,
    // Atmosphere+ Emitter locations - persisted across reloads
    EmitterLocations: [] as EmitterLocationKey[],
} as const;
