import { Entity, system } from "@minecraft/server";
import { Maybe } from "Types/Maybe";
import EntityUtil from "Utilities/EntityUtil";
import Runner from "Utilities/Runner";
import Eggman from "../Eggman";

export default abstract class Gadget {
    abstract readonly gadgetId: number;

    readonly canDestroyBlocks: boolean = false;
    readonly spawnInvulnerable: boolean = false;

    entity: Entity;
    eggmanComponent: Eggman;

    private runnerIds: number[] = [];

    constructor(eggman: Entity, eggmanComponent: Eggman) {
        this.entity = eggman;
        this.eggmanComponent = eggmanComponent;

        this.init();
    }

    protected init() {
        return;
    }

    process() {
        return;
    }

    interval(callback: () => void, interval: number, condition = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runInterval(newCallback, interval);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    timeout(callback: () => void, delay: number, condition = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runTimeout(newCallback, delay);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    timeline(timeline: Record<number, () => void>, condition = this.isValidConditional(this.entity)) {
        Object.entries(timeline).forEach(([time, callback]) => {
            this.timeout(() => callback(), (time as unknown as number) * 20, condition);
        });
    }

    isValidConditional(entity: Maybe<Entity>) {
        return () => EntityUtil.isValid(entity);
    }

    isValidConditionalMult(entities: Maybe<Entity>[]) {
        return () => entities.every((entity) => EntityUtil.isValid(entity));
    }

    destroy() {
        this.runnerIds.forEach((runnerId) => Runner.clear(runnerId));
    }
}
