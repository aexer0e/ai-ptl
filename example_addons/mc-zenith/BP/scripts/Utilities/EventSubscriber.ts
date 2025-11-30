import { system, SystemAfterEvents, world, WorldAfterEvents, WorldBeforeEvents } from "@minecraft/server";

type PublicInstance<T> = { [K in keyof T]: T[K] };
type EventClassType = typeof eventClasses;
export type EventClassName = keyof EventClassType;
export type EventName<ClassName extends EventClassName> = keyof EventClassType[ClassName];
type EventType<ClassName> = ClassName extends { subscribe: (callback: (arg: infer U) => void, ...args: unknown[]) => unknown } ? U : never;
type EventSignalType<ClassName extends EventClassName, Name extends EventName<ClassName>> = EventType<
    PublicInstance<EventClassType[ClassName]>[Name]
>;
export type EventCallback<ClassName extends EventClassName, Name extends EventName<ClassName>> = (
    event: EventSignalType<ClassName, Name>
) => void;

const eventClasses = {
    SystemAfterEvents: {} as PublicInstance<SystemAfterEvents>,
    WorldAfterEvents: {} as PublicInstance<WorldAfterEvents>,
    WorldBeforeEvents: {} as PublicInstance<WorldBeforeEvents>,
};

class _EventSubscriber {
    private static events = new Map<string, EventWrapper<EventClassName, EventName<EventClassName>>>();

    static subscribe<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        className: ClassName,
        eventName: Name,
        callback: EventCallback<ClassName, Name>
    ): number {
        const eventKey = _EventSubscriber.getEventKey(className, eventName);

        if (!this.events.has(eventKey)) {
            const wrapper = new EventWrapper(className, eventName) as EventWrapper<ClassName, EventName<EventClassName>>;
            this.events.set(eventKey, wrapper);
        }

        const wrapper = this.events.get(eventKey)!;
        return wrapper.subscribe(callback);
    }

    static unsubscribe<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        className: ClassName,
        eventName: Name,
        callbackOrId: EventCallback<ClassName, Name> | number
    ): void {
        const eventKey = _EventSubscriber.getEventKey(className, eventName);

        if (!this.events.has(eventKey)) {
            return;
        }

        const wrapper = this.events.get(eventKey)!;
        wrapper.unsubscribe(callbackOrId);
    }

    private static getEventKey<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        className: ClassName,
        eventName: Name
    ): string {
        return `${className}:${String(eventName)}`;
    }
}

class EventWrapper<ClassName extends EventClassName, Name extends EventName<ClassName>> {
    private nativeId: number = -1;
    private idCounter = 0;
    private idToCallback: Map<number, EventCallback<ClassName, Name>> = new Map();
    private callbackToId: Map<EventCallback<ClassName, Name>, number> = new Map();
    private isRegistered = false;

    constructor(
        private className: ClassName,
        private eventName: Name
    ) {
        this.init();
    }

    subscribe(callback: EventCallback<ClassName, Name>): number {
        if (!this.isRegistered) {
            this.init();
        }

        const id = this.idCounter++;
        this.idToCallback.set(id, callback);
        this.callbackToId.set(callback, id);
        return id;
    }

    unsubscribe(callbackOrId: EventCallback<ClassName, Name> | number): void {
        if (typeof callbackOrId === "number") {
            const callback = this.idToCallback.get(callbackOrId);
            if (callback) {
                this.idToCallback.delete(callbackOrId);
                this.callbackToId.delete(callback);
            }
        } else {
            const id = this.callbackToId.get(callbackOrId);
            if (id !== undefined) {
                this.idToCallback.delete(id);
                this.callbackToId.delete(callbackOrId);
            }
        }

        if (this.idToCallback.size === 0) {
            this.destroy();
        }
    }

    private init(): void {
        this.nativeId = this.subscribeNative((eventData) => this.executeCallbacks(eventData));
        this.isRegistered = true;
    }

    private destroy(): void {
        this.unsubscribeNative(this.nativeId);
        this.nativeId = -1;
        this.idCounter = 0;
        this.idToCallback.clear();
        this.callbackToId.clear();
        this.isRegistered = false;
    }

    private executeCallbacks(event: EventSignalType<ClassName, Name>): void {
        for (const callback of this.idToCallback.values()) {
            callback(event);
        }
    }

    private subscribeNative(callback: EventCallback<ClassName, Name>): number {
        switch (this.className) {
            case "SystemAfterEvents":
                return (
                    system.afterEvents[this.eventName as keyof SystemAfterEvents] as unknown as {
                        subscribe: (cb: EventCallback<"SystemAfterEvents", keyof SystemAfterEvents>) => number;
                    }
                ).subscribe(callback as EventCallback<"SystemAfterEvents", keyof SystemAfterEvents>);
            /*
            case "SystemBeforeEvents":
                return (
                    system.beforeEvents[this.eventName as keyof SystemBeforeEvents] as unknown as {
                        subscribe: (cb: EventCallback<"SystemBeforeEvents", keyof SystemBeforeEvents>) => number;
                    }
                ).subscribe(callback as EventCallback<"SystemBeforeEvents", keyof SystemBeforeEvents>);
            */
            case "WorldAfterEvents":
                return (
                    world.afterEvents[this.eventName as keyof WorldAfterEvents] as unknown as {
                        subscribe: (cb: EventCallback<"WorldAfterEvents", keyof WorldAfterEvents>) => number;
                    }
                ).subscribe(callback as EventCallback<"WorldAfterEvents", keyof WorldAfterEvents>);
            case "WorldBeforeEvents":
                return (
                    world.beforeEvents[this.eventName as keyof WorldBeforeEvents] as unknown as {
                        subscribe: (cb: EventCallback<"WorldBeforeEvents", keyof WorldBeforeEvents>) => number;
                    }
                ).subscribe(callback as EventCallback<"WorldBeforeEvents", keyof WorldBeforeEvents>);
            default:
                return -1;
        }
    }

    private unsubscribeNative(subscriptionId: number): void {
        if (subscriptionId < 0) return;

        switch (this.className) {
            case "SystemAfterEvents":
                (
                    system.afterEvents[this.eventName as keyof SystemAfterEvents] as unknown as {
                        unsubscribe: (id: number) => void;
                    }
                ).unsubscribe(subscriptionId);
                break;
            /*
            case "SystemBeforeEvents":
                (
                    system.beforeEvents[this.eventName as keyof SystemBeforeEvents] as unknown as {
                        unsubscribe: (id: number) => void;
                    }
                ).unsubscribe(subscriptionId);
                break;
            */
            case "WorldAfterEvents":
                (
                    world.afterEvents[this.eventName as keyof WorldAfterEvents] as unknown as {
                        unsubscribe: (id: number) => void;
                    }
                ).unsubscribe(subscriptionId);
                break;
            case "WorldBeforeEvents":
                (
                    world.beforeEvents[this.eventName as keyof WorldBeforeEvents] as unknown as {
                        unsubscribe: (id: number) => void;
                    }
                ).unsubscribe(subscriptionId);
                break;
        }
    }
}

declare global {
    // eslint-disable-next-line no-var
    var EventSubscriber: Omit<typeof _EventSubscriber, "prototype">;
}
globalThis.EventSubscriber = _EventSubscriber;
