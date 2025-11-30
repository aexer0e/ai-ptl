import { Entity } from "@minecraft/server";
import { MobComponentEntityStores, MobComponentTemporaryEntityStores } from "MobComponents/MobComponents/index";
import { TriggerEntityStores, TriggerTemporaryEntityStores } from "Triggers/Triggers/index";
import V3 from "Wrappers/V3";

export const TemporaryProperties = {
    ...MobComponentTemporaryEntityStores,
    ...TriggerTemporaryEntityStores,
    PlayerFullyJoined: false as boolean,
    EnteredVolumes: [] as number[],
    Target: null as Entity | null,

    OwnerPlayerId: "" as string,
    OwnerDragonId: "" as string,
};

export const PersistentProperties = {
    ...MobComponentEntityStores,
    ...TriggerEntityStores,
    PlayerInitialized: false as boolean,
    IsInitialized: false as boolean,
    LinkedOwnerId: "" as string,
    EnteredVolumes: [] as number[],
    linkIdDefault: "" as string,
    Stamina: 0 as number | "infinite",
    MovementType: "ground_movement" as "flight" | "ground_movement",
    Trust: 0,
    PassiveTrustAddedInCurrentMilestone: 0,
    InitialDirection: V3.zero.asVector3(),
    EntityVersion: 0 as number,
    PersistentDragonId: -1 as number,

    // For Book and Configurable Menu
    playerGivenBook: false as boolean,
    bookUserId: "" as string,
};

export type Properties = typeof TemporaryProperties & typeof PersistentProperties;
