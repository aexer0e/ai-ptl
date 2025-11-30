import { SystemAfterEvents, /* SystemBeforeEvents, */ WorldAfterEvents, WorldBeforeEvents } from "@minecraft/server";

export type PublicInstance<T> = { [K in keyof T]: T[K] };
export type EventClassType = typeof eventClasses;
export type EventClassName = keyof EventClassType;
export type EventName<ClassName extends EventClassName> = keyof EventClassType[ClassName];
export type EventType<ClassName> = ClassName extends { subscribe: (callback: (arg: infer U) => void, ...args: unknown[]) => unknown }
    ? U
    : never;
export type EventSignalType<ClassName extends EventClassName, Name extends EventName<ClassName>> = EventType<
    PublicInstance<EventClassType[ClassName]>[Name]
>;
export type EventCallback<ClassName extends EventClassName, Name extends EventName<ClassName>> = (
    event: EventSignalType<ClassName, Name>
) => void;

const eventClasses = {
    SystemAfterEvents: {} as PublicInstance<SystemAfterEvents>,
    // SystemBeforeEvents: {} as PublicInstance<SystemBeforeEvents>,
    WorldAfterEvents: {} as PublicInstance<WorldAfterEvents>,
    WorldBeforeEvents: {} as PublicInstance<WorldBeforeEvents>,
};
