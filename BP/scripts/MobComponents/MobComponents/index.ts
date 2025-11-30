import { MergeUnion, ObjectEntries } from "Types/GenericTypes";
import PlayerJoin from "./PlayerJoin";

const MobComponents = {
    PlayerJoin,
};

const MobComponentArray = Object.values(MobComponents);

export type Pre = ObjectEntries<"Events", (typeof MobComponentArray)[number]>;
export type MobComponentEvents = MergeUnion<Pre>;

export const MobComponentEntityStores = MobComponentArray.reduce(
    (acc, e) => ({ ...acc, ...e.EntityStore }),
    {} as MergeUnion<ObjectEntries<"EntityStore", (typeof MobComponentArray)[number]>>
);

export const MobComponentTemporaryEntityStores = MobComponentArray.reduce(
    (acc, e) => ({ ...acc, ...e.EntityStoreTemporary }),
    {} as MergeUnion<ObjectEntries<"EntityStoreTemporary", (typeof MobComponentArray)[number]>>
);

export const MobComponentWorldStores = MobComponentArray.reduce(
    (acc, e) => ({ ...acc, ...e.WorldStore }),
    {} as MergeUnion<ObjectEntries<"WorldStore", (typeof MobComponentArray)[number]>>
);

export default MobComponents;
