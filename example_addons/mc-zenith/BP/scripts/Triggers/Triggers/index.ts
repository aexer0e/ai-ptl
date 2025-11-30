import { MergeUnion, ObjectEntries } from "Types/GenericTypes";
import DragonExplosions from "./DragonExplosions";

const Triggers = {
    DragonExplosions,
};

const TriggerArray = Object.values(Triggers);

export type Pre = ObjectEntries<"Events", (typeof TriggerArray)[number]>;
export type TriggerEvents = MergeUnion<Pre>;

export const TriggerEntityStores = TriggerArray.reduce(
    (acc, e) => ({ ...acc, ...e.EntityStore }),
    {} as MergeUnion<ObjectEntries<"EntityStore", (typeof TriggerArray)[number]>>
);

export const TriggerTemporaryEntityStores = TriggerArray.reduce(
    (acc, e) => ({ ...acc, ...e.EntityStoreTemporary }),
    {} as MergeUnion<ObjectEntries<"EntityStoreTemporary", (typeof TriggerArray)[number]>>
);

export const TriggerWorldStores = TriggerArray.reduce(
    (acc, e) => ({ ...acc, ...e.WorldStore }),
    {} as MergeUnion<ObjectEntries<"WorldStore", (typeof TriggerArray)[number]>>
);

export default Triggers;
