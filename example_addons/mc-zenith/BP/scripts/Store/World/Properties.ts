import { MobComponentWorldStores } from "MobComponents/MobComponents/index";
import { TriggerWorldStores } from "Triggers/Triggers/index";

export default {
    ...MobComponentWorldStores,
    ...TriggerWorldStores,
    CbCopyVolumeModeSelected: 0 as number,
    CbCopyBlockModeSelected: 0 as number,
    CbLeftClickCopiesBlock: false as boolean,
    CbRightClickCopiesBlock: false as boolean,
    DragonPersistentDataMap: "[]" as string,
    NextPersistentDragonId: 1 as number,
} as const;
