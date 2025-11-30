import { system } from "@minecraft/server";

class _EventEmitter<TEvents extends Record<string, TEvents[string][]>> {
    private events: { [event: string]: ((...args) => void)[] };

    constructor(log = false) {
        this.events = {};

        if (log) system.runInterval(() => this.onTick(), 20);
    }

    emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
        if (this.events[eventName]) {
            this.events[eventName].forEach((callback) => callback(...eventArg));
        }
    }

    subscribe<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
    }

    unsubscribe<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter((cb) => cb !== handler);
        }
    }

    onTick() {
        const counts: { [event: string]: number } = {};
        let string = "";
        for (const event in this.events) {
            counts[event] = this.events[event].length;
            string += `${event}: ${counts[event]}\n`;
        }
        console.warn(string);
    }
}

declare global {
    // eslint-disable-next-line no-var
    var EventEmitter: typeof _EventEmitter;
}
globalThis.EventEmitter = _EventEmitter;
