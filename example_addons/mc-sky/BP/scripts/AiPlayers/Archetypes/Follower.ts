import { Entity, system } from "@minecraft/server";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import EntityStore from "Store/Entity/EntityStore";
import Archetype, { GoalEntry } from "./Archetype";

export default class extends Archetype {
    tickEvery = 20 * 20;
    craftedTick = system.currentTick;
    delayItemPick = 0;
    leatherObtained = EntityStore.get(this.entity, "leatherObtained");

    goals: GoalEntry = {
        FleeMonsters: {
            priority: () => {
                if (AiPlayerWrapper.hasSeenMonsterInLastTicks(this.entity, 5 * 20) && this.health <= 8) return 0;
                return false;
            },
        },
        PickupItems: {
            priority: (goal, currentGoal, isComplete) => {
                const consoleWarnParams = false;
                if (consoleWarnParams) console.warn(currentGoal, isComplete);

                if (this.distanceToNearestUsefulItem < 6) return 13.5;
                return false;
            },
        },
        ThrowUselessItems: {
            priority: () => {
                if (this.hasUselessItem()) return 2.6;
                return false;
            },
        },
        EatFood: {
            priority: (goal, currentGoal) => {
                if (currentGoal == "EatFood" && goal?.complete) return false;
                if (this.hunger < 25 && this.hasFood()) return 3;
                return false;
            },
        },
        AttackPlayers: {
            priority: () => {
                if (this.entity.hasTag("should_attack_players")) return 2;
                return false;
            },
        },
        AttackMonsters: {
            priority: () => {
                if (AiPlayerWrapper.FpHasAttackedHostileMobInLastTicks(this.entity, 30 * 20) && this.hasWeapon()) return 10;
                if (
                    AiPlayerWrapper.hasTakenDamageInLastTicks(this.entity, 5 * 20) &&
                    this.health > 8 &&
                    AiPlayerWrapper.hasSeenMonsterInLastTicks(this.entity, 20 * 20)
                )
                    return 1;
                return false;
            },
        },
        AttackAnimals: {
            priority: () => {
                if (AiPlayerWrapper.FpHasAttackedPassiveMobInLastTicks(this.entity, 30 * 20) && this.hasWeapon()) return 11;
                return false;
            },
        },
        ChopTrees: {
            priority: () => {
                if (
                    AiPlayerWrapper.FpHasChoppedTreeInLastTicks(this.entity, 30 * 20) &&
                    this.hasAxe() &&
                    AiPlayerWrapper.hasTakenDamageInLastTicks(this.entity, 20 * 20) == false
                )
                    return 12;
                return false;
            },
        },
        EquipArmor: {
            priority: () => {
                // const distanceToNearestPlayer = this.distanceToNearestPlayer;
                if (AiPlayerWrapper.hasBetterArmorThanEquipped(this.entity)) return -1;
                return false;
            },
        },
        MineOres: {
            priority: () => {
                if (
                    AiPlayerWrapper.FpHasMinedOreInLastTicks(this.entity, 30 * 20) &&
                    this.hasPickaxe() &&
                    AiPlayerWrapper.hasTakenDamageInLastTicks(this.entity, 20 * 20) == false
                )
                    return 13;
                return false;
            },
        },
        RunAround: {
            priority: () => {
                return 15;
            },
        },
        FollowPlayers: {
            priority: () => {
                const distanceToNearestPlayer = this.distanceToNearestPlayer;
                if (distanceToNearestPlayer > 16) return 9;
                if (distanceToNearestPlayer > 3) return 14;

                return false;
            },
        },
        Sleep: {
            priority: () => {
                if (
                    AiPlayerWrapper.getTimeOfDay(this.entity) == "Night" &&
                    AiPlayerWrapper.timeSinceSeenBed(this.entity) < 20 * 45 &&
                    AiPlayerWrapper.hasAssignedBedNearby(this.entity)
                )
                    return 4;
                return false;
            },
        },
        OpenDoor: {
            priority: () => {
                if (AiPlayerWrapper.timeSinceDoorNearby(this.entity) < 20) return 16;
                return false;
            },
        },
    };

    static priority(_entity: Entity) {
        if (AiPlayerWrapper.hasPlayerEmotedAtInLastTicks(_entity, 2000, "Follow Me")) return -1;
        return 1;
    }
}
