import { Entity, system } from "@minecraft/server";
import GameData from "Game/GameData";
import { EventCallback, EventClassName, EventName } from "Types/Events";
import { GameEvents } from "Types/GameEvents";
import { Maybe } from "Types/Maybe";
import DebugTimer from "Utilities/DebugTimer";
import EntityUtil from "Utilities/EntityUtil";
import EventUtil from "Utilities/EventUtil";
import Runner from "Utilities/Runner";

/**
 * MobComponent class to manage the behavior and properties of a mob entity.
 */
export default class MobComponent {
    static readonly EntityTypes: string[];
    entity: Entity | null;
    entityId: string;
    entityTypeId: string;
    runnerId: Maybe<number> = null;
    processInterval: Maybe<number> = null;
    private worldSubscriptions: [type: EventClassName, event: string, callback: number][] = [];
    private gameSubscriptions: [event: keyof GameEvents, callback: (...args: never) => void][] = [];
    private runnerIds: number[] = [];

    /**
     * Constructs a new instance of the MobComponent.
     *
     * @param entity - The entity associated with this component.
     * @param processInterval - Optional. The interval in milliseconds at which the process method should be called.
     * @param _preExisting - Optional. A flag indicating if the component is pre-existing. Defaults to false.
     */
    constructor(entity: Entity, processInterval?: Maybe<number>, _preExisting = false) {
        this.entity = entity;
        this.entityId = entity.id;
        this.entityTypeId = entity.typeId;
        this.processInterval = processInterval;

        if (this.processInterval) {
            this.runnerId = Runner.interval(() => {
                DebugTimer.countStart(`MobComponent[${this.constructor.name}].process`);
                this.process();
                DebugTimer.countEnd();
            }, this.processInterval);
        }
    }

    onWorldEvent<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        type: ClassName,
        event: Name,
        callback: EventCallback<ClassName, Name>
    ) {
        this.worldSubscriptions.push([type, event as string, EventUtil.subscribe(type, event, callback)]);
    }

    /**
     * Subscribes to a specified game event and registers a callback to be executed when the event occurs.
     *
     * @template GameEvent - The type of the game event to subscribe to.
     * @param event - The game event to subscribe to.
     * @param callback - The function to be called when the event occurs. The arguments of the callback
     *                   are determined by the type of the event.
     */
    onGameEvent<GameEvent extends keyof GameEvents>(event: GameEvent, callback: (...args: GameEvents[GameEvent]) => void) {
        this.gameSubscriptions.push([event, callback]);
        GameData.events.subscribe(event, callback);
    }

    /**
     * Sets up a recurring interval to execute a callback function.
     *
     * @param callback - The function to be executed at each interval.
     * @param interval - The time interval (in milliseconds) between each execution of the callback.
     * @param condition - An optional function that returns a boolean. If provided, the callback will only be executed if this condition returns true.
     * @returns The ID of the interval runner, which can be used to manage the interval.
     */
    interval(callback: () => void, interval: number, condition: () => boolean = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runInterval(newCallback, interval);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    /**
     * Schedules a callback function to be executed after a specified delay.
     * If a condition function is provided, the callback will only be executed if the condition returns true.
     *
     * @param callback - The function to be executed after the delay.
     * @param delay - The delay in milliseconds before executing the callback.
     * @param condition - An optional function that returns a boolean. The callback will only be executed if this function returns true.
     * @returns The identifier of the scheduled runner, which can be used to manage the timeout.
     */
    timeout(callback: () => void, delay: number, condition: () => boolean = this.isValidConditional(this.entity)) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        const runnerId = system.runTimeout(newCallback, delay);
        this.runnerIds.push(runnerId);
        return runnerId;
    }

    /**
     * Checks if the given entity is valid based on certain conditions.
     *
     * @param entity - The entity to be validated, which may or may not be defined.
     * @returns A function that returns a boolean indicating whether the entity is valid.
     */
    isValidConditional(entity: Maybe<Entity>) {
        return () => EntityUtil.isValid(entity);
    }

    /**
     * Checks if all entities in the provided array are valid.
     *
     * @param entities - An array of entities that may or may not be valid.
     * @returns A function that returns `true` if all entities are valid, otherwise `false`.
     */
    isValidConditionalMult(entities: Maybe<Entity>[]) {
        return () => entities.every((entity) => EntityUtil.isValid(entity));
    }

    /**
     * Executes a series of callbacks at specified times, optionally conditioned by a provided function.
     *
     * @param timeline - An object where the keys are times (in seconds) and the values are callback functions to be executed at those times.
     * @param condition - An optional function that returns a boolean. If provided, the callbacks will only be executed if this condition is true.
     */
    timeline(timeline: Record<number, () => void>, condition: () => boolean = this.isValidConditional(this.entity)) {
        Object.entries(timeline).forEach(([time, callback]) => {
            this.timeout(() => callback(), (time as unknown as number) * 20, condition);
        });
    }

    /**
     * Processes the current mob component.
     *
     * @returns {void} This method does not return any value.
     */
    process() {
        return;
    }

    /**
     * Cleans up and unsubscribes from all events and runners associated with this component.
     *
     * This method performs the following actions:
     * - Unsubscribes from all world events (both before and after events).
     * - Unsubscribes from all game events.
     * - Clears all runner IDs.
     * - Clears the main runner ID if it is a number.
     *
     * @remarks
     * This method is intended to be called when the component is no longer needed to ensure
     * that all resources are properly released and no memory leaks occur.
     */
    destroy() {
        const worldSubscriptions = this.worldSubscriptions;
        worldSubscriptions;
        this.worldSubscriptions.forEach(([type, event, id]) => {
            EventUtil.unsubscribe(type, event as unknown as never, id);
        });

        this.gameSubscriptions.forEach(([event, callback]) => {
            GameData.events.unsubscribe(event, callback);
        });

        this.runnerIds.forEach((runnerId) => Runner.clear(runnerId));

        if (typeof this.runnerId == "number") Runner.clear(this.runnerId);
        this.runnerId = null;
    }
}
