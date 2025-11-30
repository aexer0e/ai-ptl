import { Block, Entity, Player, Vector3 } from "@minecraft/server";
import GameData from "Game/GameData";
import { ArmorTier } from "Types/ArmorSlot";
import V3 from "Wrappers/V3";

type Cache<T> = { tick: number; value: T } | undefined;

export const TemporaryProperties = {
    playerFullyJoined: false as boolean,
    enteredVolumes: "[]" as string,
    isUsingAttackComponent: false as boolean,
    monsterSeenTick: 0 as number,
    mobSeenTick: 0 as number,
    bedSeenTick: 0 as number,
    takenDamageTick: 0 as number,
    playerEmotedAtTick: 0 as number,
    playerEmotedAtPersonaId: "" as string,

    logNearbyTick: 0 as number,
    crafting_tableNearbyTick: 0 as number,
    oreNearbyTick: 0 as number,
    furnaceNearbyTick: 0 as number,
    chestNearbyTick: 0 as number,
    doorNearbyTick: 0 as number,

    owner: undefined as Player | undefined,

    nearestPlayer: undefined as Cache<Player | undefined>,
    distanceToNearestPlayer: undefined as Cache<number>,
    nearestItemEntity: undefined as Cache<Entity | undefined>,
    distanceToNearestItem: undefined as Cache<number>,
    timeOfDay: undefined as Cache<string>,
    blockInside: undefined as Cache<Block | undefined>,
    blockBelow: undefined as Cache<Block | undefined>,
    blockAbove: undefined as Cache<Block | undefined>,
    weather: undefined as Cache<"clear" | "rain" | "thunder">,
    targetItem: undefined as Entity | undefined,
    targetBlock: undefined as { block: Block; markerLocation: V3 } | undefined,
    rcBlockCache: {} as Record<
        (typeof GameData)["DetectableBlocks"][number],
        undefined | { block?: Block; timestamp: number; faceLocation?: V3 }
    >,
};

export const PersistentProperties = {
    linkedEntityId: "" as string,
    linkedOwnerId: "" as string,
    linkedChildrenIds: [] as string[],
    playerInitialized: false as boolean,
    enteredVolumes: "[]" as string,
    currentGoal: "" as string,
    currentArchetype: "" as string,
    currentState: "" as string,
    name: "" as string,
    bodytypeSkin: -1 as number,
    baseSkin: -1 as number,
    pantsSkin: -1 as number,
    shirtSkin: -1 as number,
    eyesSkin: -1 as number,
    eyesColorSkin: -1 as number,
    mouthSkin: -1 as number,
    mouthColorSkin: -1 as number,
    hairSkin: -1 as number,
    hairColorSkin: -1 as number,
    trust: "{}" as string,
    socialBattery: 50 as number,
    trustLongTerm: "{}" as string,
    desiredTradable: "" as string,
    titleOfDeed: "" as string,
    hunger: 100 as number,
    builtStructure: false as boolean,
    lastRespawnTick: 0 as number,
    lastDeathTick: 0 as number,
    lastLogoutTick: 0 as number,
    firstLoginTick: 0 as number,
    lastLoginTick: 0 as number,
    lastRelocateTick: 0 as number,
    monstersKilled: 0 as number,
    deaths: 0 as number,
    woodObtained: 0 as number,
    stoneObtained: 0 as number,
    leatherObtained: 0 as number,
    ironObtained: 0 as number,
    diamondObtained: 0 as number,
    loadedTick: 0 as number,
    armorTier0: ArmorTier.None as ArmorTier,
    armorTier1: ArmorTier.None as ArmorTier,
    armorTier2: ArmorTier.None as ArmorTier,
    armorTier3: ArmorTier.None as ArmorTier,
    blockLocation: {} as Vector3,
    bedUserName: "<empty>" as string, // for ai bed
    assignedAiBedEntityId: "" as string, // for ai player
};

export type Properties = typeof TemporaryProperties & typeof PersistentProperties;
