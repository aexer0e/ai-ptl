import { MobComponentWorldStores } from "MobComponents/MobComponents/index";
import { TriggerWorldStores } from "Triggers/Triggers/index";

export default {
    ...MobComponentWorldStores,
    ...TriggerWorldStores,
    CutsceneDebug: false as boolean,
    CbCopyVolumeModeSelected: 0 as number,
    CbCopyBlockModeSelected: 0 as number,
    CbLeftClickCopiesBlock: false as boolean,
    CbRightClickCopiesBlock: false as boolean,
} as const;
