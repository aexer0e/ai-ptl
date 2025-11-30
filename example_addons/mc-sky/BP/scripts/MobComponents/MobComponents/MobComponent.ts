import { Entity, system } from "@minecraft/server";
import { Maybe } from "Types/Maybe";
import EntityWrapper from "Utilities/EntityWrapper";
import MathUtil from "Utilities/MathUtil";
import Runner from "Utilities/Runner";

export default class MobComponent extends EntityWrapper {
    static readonly EntityTypes: string[];
    runnerId: Maybe<number> = null;
    processInterval: Maybe<number> = null;
    intId: number = 0;

    constructor(entity: Entity, processInterval?: Maybe<number>, _preExisting = false) {
        super(entity);
        this.entity = entity;
        this.processInterval = processInterval;
        this.intId = MathUtil.hashPositiveInt(entity.id);

        if (this.processInterval) {
            this.runnerId = Runner.interval(() => this.process(), this.processInterval);
        }
    }

    process() {
        return;
    }

    destroy() {
        super.destroy();

        this.runnerIds.forEach((runnerId) => Runner.clear(runnerId));

        if (typeof this.runnerId == "number") Runner.clear(this.runnerId);
        this.runnerId = null;
    }

    isCurrentTickNth(n: number) {
        const timeStampt = system.currentTick + this.intId;
        return timeStampt % n == 0;
    }
}
