import { MobComponentWorldStores } from "MobComponents/MobComponents/index";

// Emitter location entry: "dimensionId:x,y,z"
type EmitterLocationKey = string;

export default {
    ...MobComponentWorldStores,
    CutsceneDebug: false as boolean,
    CbCopyVolumeModeSelected: 0 as number,
    CbCopyBlockModeSelected: 0 as number,
    CbLeftClickCopiesBlock: false as boolean,
    CbRightClickCopiesBlock: false as boolean,
    // DIY Particles Emitter locations - persisted across reloads
    EmitterLocations: [] as EmitterLocationKey[],
} as const;
