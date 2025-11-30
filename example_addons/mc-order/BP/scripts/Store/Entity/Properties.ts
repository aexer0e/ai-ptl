import { Vector3 } from "@minecraft/server";
import V3 from "Wrappers/V3";

export const TemporaryProperties = {
    playerFullyJoined: false as boolean,
    enteredVolumes: "[]" as string,
    SprungTimestamp: 0 as number,
    targetLocation: null as V3 | null,
};

export const PersistentProperties = {
    // Not used
    enteredVolumes: "[]" as string,
    linkedOwnerId: "" as string,
    linkedChildrenIds: [] as string[],
    // General
    blockLocation: {} as Vector3,
    spawnLocation: {} as Vector3,
    // For Book and Configurable Menu
    playerGivenBook: false as boolean,
    bookUserId: "" as string,
    canRunBreak: true as boolean,
    canAbilityBreak: true as boolean,
    canDamagePassiveMobs: true as boolean,
    // For Eggman and PlayerJoin
    playerInitialized: false as boolean,
    // For link: eggman shrine, chase shrine, player, emerald
    completedShrineIds: [] as string[], // owner: player
    linkIdDefault: "" as string, // never used !!!
    emeraldLinkId: "" as string,
    bossEmeraldLinkId: "" as string,
    targetLinkId: "" as string, // target ShrineMarker with Player
    eggmanLinkId: "" as string,
    // For emerald generation
    EmeraldStage: 0 as number, // owner: player
};

export type Properties = typeof TemporaryProperties & typeof PersistentProperties;
