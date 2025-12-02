import { MobComponentEntityStores, MobComponentTemporaryEntityStores } from "MobComponents/MobComponents/index";

export const TemporaryProperties = {
    ...MobComponentTemporaryEntityStores,
    PlayerFullyJoined: false as boolean,
};

export const PersistentProperties = {
    ...MobComponentEntityStores,
    PlayerInitialized: false as boolean,
    LinkedOwnerId: "" as string,
    linkIdDefault: "" as string,
    linkIdHitreg: "" as string,
};

export type Properties = typeof TemporaryProperties & typeof PersistentProperties;
