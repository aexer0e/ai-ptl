import { Entity, Player, system } from "@minecraft/server";
import { GameEvents } from "Types/GameEvents";
import { Maybe } from "Types/GenericTypes";
import { EventCallback, EventClassName, EventName } from "Utilities/EventSubscriber";

export type EntityReference = Entity | Pick<Entity, "id" | "try" | "valid">;
export type PlayerReference = Player | Pick<Player, "id" | "try" | "valid">;

export default class MobComponent {
    static readonly EntityTypes: string[];
    static readonly Events: object;
    static readonly EntityStore = {};
    static readonly EntityStoreTemporary = {};
    static readonly WorldStore = {};
    entity: Entity | EntityReference;
    entityF: Entity;
    entityId: string;
    entityTypeId: string;
    runnerId: Maybe<number> = null;
    processInterval: Maybe<number> = null;
    private intId: number = 0;
    private worldSubscriptions: [type: EventClassName, event: string, callback: number][] = [];
    private gameSubscriptions: [event: keyof GameEvents, callback: (...args: never) => void][] = [];
    private runnerIds: number[] = [];

    constructor(entity: Entity, processInterval?: Maybe<number>, _preExisting = false) {
        this.entity = entity;
        this.entityF = entity;
        this.entityId = entity.id;
        this.entityTypeId = entity.typeId;
        this.processInterval = processInterval;
        this.intId = MathUtil.hashPositiveInt(this.entityId);

        if (this.processInterval) {
            this.runnerId = system.runTimeout(() => this.preProcess(), this.processInterval);
        }
    }

    private preProcess() {
        DebugTimer.countStart(`MB.preProcess.${this.constructor.name}`);
        this.process();
        this.runnerId = system.runTimeout(() => this.preProcess(), this.processInterval!);
        DebugTimer.countEnd();
    }

    protected onWorldEvent<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        type: ClassName,
        event: Name,
        callback: EventCallback<ClassName, Name>
    ) {
        this.worldSubscriptions.push([type, event as string, EventSubscriber.subscribe(type, event, callback)]);
    }

    protected onGameEvent<GameEvent extends keyof GameEvents>(event: GameEvent, callback: (...args: GameEvents[GameEvent]) => void) {
        this.gameSubscriptions.push([event, callback]);
        GameData.events.subscribe(event, callback);
    }

    protected interval(callback: () => void, interval: number, condition?: () => boolean) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runInterval(newCallback, interval);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    protected timeout(callback: () => void, delay: number, condition?: () => boolean) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runTimeout(newCallback, delay);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    protected isValidConditional(entity: EntityReference) {
        return () => EntityUtil.isValid(entity);
    }

    protected isValidConditionalMult(entities: EntityReference[]) {
        return () => entities.every((entity) => EntityUtil.isValid(entity));
    }

    protected timeline(timeline: Record<number, () => void>, condition?: () => boolean) {
        Object.entries(timeline).forEach(([time, callback]) => {
            this.timeout(() => callback(), (time as unknown as number) * 20, condition);
        });
    }

    process() {
        return;
    }

    protected isCurrentTickNth(n: number) {
        const timeStampt = Main.currentTick + this.intId;
        return timeStampt % n == 0;
    }

    destroy() {
        this.worldSubscriptions.forEach(([type, event, id]) => {
            EventSubscriber.unsubscribe(type, event as unknown as never, id);
        });

        this.gameSubscriptions.forEach(([event, callback]) => {
            GameData.events.unsubscribe(event, callback);
        });

        this.runnerIds.forEach((runnerId) => system.clearRun(runnerId));

        if (typeof this.runnerId == "number") system.clearRun(this.runnerId);
        this.runnerId = null;
    }
}

export class MobComponentPlayer extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];
    declare entity: Player | PlayerReference;
    declare entityF: Player;
}
