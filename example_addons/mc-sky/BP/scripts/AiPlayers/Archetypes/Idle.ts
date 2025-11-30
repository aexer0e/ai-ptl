import { Entity } from "@minecraft/server";
import AiPlayerWrapper from "AiPlayers/AiPlayerWrapper";
import Archetype, { GoalEntry } from "./Archetype";

export default class extends Archetype {
    shouldFollowPlayer = false;

    goals: GoalEntry = {
        LookAtPlayer: {
            priority: (goal) => {
                if (goal && goal.stateTime > 3 * 20) return 0;
                if (Math.random() < 0.1) {
                    return -6;
                }
                return 9;
            },
        },
        RunAround: {
            priority: (goal) => {
                if (goal && goal.stateTime > 3 * 20) return 0;
                if (Math.random() < 0.025) {
                    return -3;
                }

                return 6;
            },
        },
    };

    static priority(_entity: Entity) {
        if (AiPlayerWrapper.hasPlayerEmotedAtInLastTicks(_entity, 2000, "Over There")) return -1;
        return 9;
    }
}
