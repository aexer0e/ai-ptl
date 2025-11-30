import { WorldAfterEvents, WorldBeforeEvents } from "@minecraft/server";

type WorldBefore<T extends keyof WorldBeforeEvents> = (event: T, ...callback: Parameters<WorldBeforeEvents[T]["subscribe"]>) => void;
type WorldAfter<T extends keyof WorldAfterEvents> = (event: T, ...callback: Parameters<WorldAfterEvents[T]["subscribe"]>) => void;

export type SubscriptionsMap = {
    WorldBefore: WorldBefore<keyof WorldBeforeEvents>;
    WorldAfter: WorldAfter<keyof WorldAfterEvents>;
};
export type Subscription<
    T extends keyof SubscriptionsMap,
    U extends keyof WorldBeforeEvents | keyof WorldAfterEvents,
> = T extends "WorldBefore"
    ? // @ts-ignore
      WorldBefore<U>
    : // @ts-ignore
      WorldAfter<U>;
