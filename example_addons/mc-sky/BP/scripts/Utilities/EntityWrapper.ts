import { Entity, system, world } from "@minecraft/server";
import GameData from "Game/GameData";
import { GameEvents } from "Types/GameEvents";
import { Maybe } from "Types/Maybe";
import { Subscription, SubscriptionsMap } from "Types/Subscription";
import EntityUtil from "Utilities/EntityUtil";
import Runner from "Utilities/Runner";

export default class EntityWrapper {
    entity: Entity | null;
    protected readonly worldSubscriptions: [type: keyof SubscriptionsMap, event: string, callback: (arg: never) => void][] = [];
    protected readonly gameSubscriptions: [event: keyof GameEvents, callback: (...args: never) => void][] = [];
    protected readonly runnerIds: number[] = [];

    constructor(entity: Entity) {
        this.entity = entity;
    }

    protected onWorldEvent<
        Type extends keyof SubscriptionsMap,
        Event extends Parameters<SubscriptionsMap[Type]>[0],
        Callback extends Parameters<Subscription<Type, Event>>[1],
        Options extends Parameters<Subscription<Type, Event>>[2],
    >(type: Type, event: Event, callback: Callback, options?: Options) {
        switch (type) {
            case "WorldBefore":
                // @ts-ignore
                this.worldSubscriptions.push(["WorldBefore", event, callback]);
                world.beforeEvents[event as keyof typeof world.beforeEvents].subscribe(callback as never);
                break;

            case "WorldAfter":
                // @ts-ignore
                this.worldSubscriptions.push(["WorldAfter", event, callback]);
                // @ts-ignore
                if (options) world.afterEvents[event as keyof typeof world.afterEvents].subscribe(callback as never, options);
                else world.afterEvents[event as keyof typeof world.afterEvents].subscribe(callback as never);
                break;
        }
    }

    protected onGameEvent<GameEvent extends keyof GameEvents>(event: GameEvent, callback: (...args: GameEvents[GameEvent]) => void) {
        this.gameSubscriptions.push([event, callback]);
        GameData.events.subscribe(event, callback);
    }

    protected interval(callback: () => void, interval: number, condition: null | (() => boolean) = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runInterval(newCallback, interval);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    protected timeout(callback: () => void, delay: number, condition: null | (() => boolean) = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runTimeout(newCallback, delay);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    protected isValidConditional(entity: Maybe<Entity>) {
        return () => EntityUtil.isValid(entity);
    }

    protected isValidConditionalMult(entities: Maybe<Entity>[]) {
        return () => entities.every((entity) => EntityUtil.isValid(entity));
    }

    protected timeline(timeline: Record<number, () => void>, condition: null | (() => boolean) = this.isValidConditional(this.entity)) {
        Object.entries(timeline).forEach(([time, callback]) => {
            this.timeout(() => callback(), (time as unknown as number) * 20, condition);
        });
    }

    destroy() {
        const worldSubscriptions = this.worldSubscriptions;
        worldSubscriptions;
        this.worldSubscriptions.forEach(([type, event, callback]) => {
            switch (type) {
                case "WorldBefore":
                    world.beforeEvents[event].unsubscribe(callback);
                    break;
                case "WorldAfter":
                    world.afterEvents[event].unsubscribe(callback);
                    break;
            }
        });

        this.gameSubscriptions.forEach(([event, callback]) => {
            GameData.events.unsubscribe(event, callback);
        });

        this.runnerIds.forEach((runnerId) => Runner.clear(runnerId));
    }
}
