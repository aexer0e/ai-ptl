import { MergeUnion, ObjectEntries } from "Types/GenericTypes";
import DragonBook from "./DragonBook";
import DeadlyNadder from "./Dragons/DeadlyNadder";
import Gronckle from "./Dragons/Gronckle";
import HideousZippleback from "./Dragons/HideousZippleback";
import MonstrousNightmare from "./Dragons/MonstrousNightmare";
import Nightfury from "./Dragons/Nightfury";
import IgniteGas from "./IgniteGas";
import IntroBook from "./IntroBook";
import PlayerDragonInteractions from "./PlayerDragonInteractions";
import PlayerJoin from "./PlayerJoin";
import GronckleProjectile from "./Projectiles/GronckleProjectile";
import DeadlyNadderProjectile from "./Projectiles/NadderProjectile";
import NightfuryProjectile from "./Projectiles/NightfuryProjectile";
import MonstrousNightmareProjectile from "./Projectiles/NightmareProjectile";
import HideousZipplebackProjectile from "./Projectiles/ZipplebackProjectile";

const MobComponents = {
    PlayerJoin,
    DeadlyNadder,
    Nightfury,
    Gronckle,
    HideousZippleback,
    MonstrousNightmare,
    IgniteGas,
    PlayerDragonInteractions,
    DeadlyNadderProjectile,
    NightfuryProjectile,
    GronckleProjectile,
    HideousZipplebackProjectile,
    MonstrousNightmareProjectile,
    IntroBook,
    DragonBook,
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
