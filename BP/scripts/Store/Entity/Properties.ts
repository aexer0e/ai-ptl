import { MobComponentEntityStores, MobComponentTemporaryEntityStores } from "MobComponents/MobComponents/index";
import { TriggerEntityStores, TriggerTemporaryEntityStores } from "Triggers/Triggers/index";

export const TemporaryProperties = {
    ...MobComponentTemporaryEntityStores,
    ...TriggerTemporaryEntityStores,
    PlayerFullyJoined: false as boolean,
};

export const PersistentProperties = {
    ...MobComponentEntityStores,
    ...TriggerEntityStores,
    PlayerInitialized: false as boolean,
    LinkedOwnerId: "" as string,
    linkIdDefault: "" as string,
    linkIdHitreg: "" as string,
};

export type Properties = typeof TemporaryProperties & typeof PersistentProperties;
