import { Entity } from "@minecraft/server";
import AiPlayer from "AiPlayers/AiPlayerWrapper";
import Goal from "AiPlayers/Goals/Goal";
import Goals from "AiPlayers/Goals/index";
import EntityStore from "Store/Entity/EntityStore";

export type GoalEntry = {
    [K in keyof typeof Goals]?: {
        priority: (
            goal: InstanceType<(typeof Goals)[K]> | undefined,
            currentGoalId: keyof typeof Goals | undefined,
            isCompleted: boolean | undefined
        ) => number | false;
    };
};

export default abstract class extends AiPlayer {
    abstract goals: GoalEntry;

    currentGoalId?: keyof typeof Goals;
    currentGoal?: Goal;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static priority(entity: Entity): number | false {
        return false;
    }

    constructor(entity: Entity, goalId?: keyof typeof Goals) {
        super(entity);

        if (goalId) {
            this.currentGoalId = goalId;
            this.currentGoal = new Goals[goalId](entity);
        }
    }

    changeGoalTo(goalId: keyof typeof Goals) {
        this.currentGoal?.onExit();
        this.currentGoal?.destroy();

        this.triggerEvent("reset_target");

        this.currentGoalId = goalId;
        this.currentGoal = new Goals[goalId](this.entity);
        this.currentGoal.onEnter();

        EntityStore.set(this.entity, "currentGoal", goalId);
    }
}
