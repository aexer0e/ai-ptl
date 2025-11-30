import { Entity, Player, system } from "@minecraft/server";
import { PersistentProperties, TemporaryProperties } from "Store/Entity/Properties";
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

    isDestroyed = false;

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
        if (this.isDestroyed) return;
        DebugTimer.countStart(`MB.preProcess.${this.constructor.name}`);
        this.process();
        this.runnerId = system.runTimeout(() => this.preProcess(), this.processInterval!);
        DebugTimer.countEnd();
    }

    onWorldEvent<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        type: ClassName,
        event: Name,
        callback: EventCallback<ClassName, Name>
    ) {
        this.worldSubscriptions.push([type, event as string, EventSubscriber.subscribe(type, event, callback)]);
    }

    onGameEvent<GameEvent extends keyof GameEvents>(event: GameEvent, callback: (...args: GameEvents[GameEvent]) => void) {
        this.gameSubscriptions.push([event, callback]);
        GameData.events.subscribe(event, callback);
    }

    interval(callback: () => void, interval: number, condition: () => boolean = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runInterval(newCallback, interval);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    timeout(callback: () => void, delay?: number, condition: () => boolean = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runTimeout(newCallback, delay);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    isValidConditional(entity: EntityReference) {
        return () => EntityUtil.isValid(entity);
    }

    isValidConditionalMult(entities: EntityReference[]) {
        return () => entities.every((entity) => EntityUtil.isValid(entity));
    }

    timeline(timeline: Record<number, () => void>, condition: () => boolean = this.isValidConditional(this.entity)) {
        Object.entries(timeline).forEach(([time, callback]) => {
            this.timeout(() => callback(), (time as unknown as number) * 20, condition);
        });
    }

    process() {
        return;
    }

    isCurrentTickNth(n: number) {
        const timeStampt = system.currentTick + this.intId;
        return timeStampt % n == 0;
    }

    timeSince(timestamp: number) {
        return Main.currentTick - timestamp;
    }

    getPersistentProperty<Type extends keyof typeof PersistentProperties>(key: Type) {
        return EntityStore.get(this.entityF, key);
    }

    setPersistentProperty<Type extends keyof typeof PersistentProperties>(key: Type, value: (typeof PersistentProperties)[Type]) {
        return EntityStore.set(this.entityF, key, value);
    }

    getTemporaryProperty<Type extends keyof typeof TemporaryProperties>(key: Type) {
        return EntityStore.temporary.get(this.entityF, key);
    }

    setTemporaryProperty<Type extends keyof typeof TemporaryProperties>(key: Type, value: (typeof TemporaryProperties)[Type]) {
        return EntityStore.temporary.set(this.entityF, key, value);
    }

    destroy() {
        const worldSubscriptions = this.worldSubscriptions;
        worldSubscriptions;
        this.worldSubscriptions.forEach(([type, event, id]) => {
            EventSubscriber.unsubscribe(type, event as unknown as never, id);
        });

        this.gameSubscriptions.forEach(([event, callback]) => {
            GameData.events.unsubscribe(event, callback);
        });

        this.runnerIds.forEach((runnerId) => system.clearRun(runnerId));

        if (typeof this.runnerId == "number") system.clearRun(this.runnerId);
        this.runnerId = null;

        this.isDestroyed = true;
    }
}

export class MobComponentPlayer extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];
    declare entity: Player | PlayerReference;
    declare entityF: Player;
}
