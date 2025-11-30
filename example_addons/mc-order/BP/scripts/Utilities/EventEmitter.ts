import { system } from "@minecraft/server";

export default class EventEmitter<TEvents extends Record<string, TEvents[string][]>> {
    private events: { [event: string]: ((...args) => void)[] };

    /**
     * Creates an instance of the EventEmitter class.
     *
     * @param log - A boolean flag to determine if logging is enabled.
     *              If true, the system will run the `onTick` method at regular intervals.
     */
    constructor(log = false) {
        this.events = {};

        if (log) system.runInterval(() => this.onTick(), 20);
    }

    /**
     * Emits an event with the specified name and arguments.
     *
     * @template TEventName - The type of the event name, constrained to the keys of TEvents that are strings.
     * @param {TEventName} eventName - The name of the event to emit.
     * @param {...TEvents[TEventName]} eventArg - The arguments to pass to the event listeners.
     */
    emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
        if (this.events[eventName]) {
            eventArg;
            this.events[eventName].forEach((callback) => callback(...eventArg));
        }
    }

    /**
     * Subscribes a handler function to a specific event.
     *
     * @template TEventName - The type of the event name, which must be a key of TEvents and a string.
     * @param eventName - The name of the event to subscribe to.
     * @param handler - The function to be called when the event is emitted. The function receives the event arguments.
     */
    subscribe<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
    }

    /**
     * Unsubscribes a handler from a specific event.
     *
     * @template TEventName - The name of the event to unsubscribe from.
     * @param eventName - The name of the event.
     * @param handler - The handler function to remove from the event's subscription list.
     */
    unsubscribe<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter((cb) => cb !== handler);
        }
    }

    /**
     * Handles the tick event by counting the number of listeners for each event
     * and logging the counts to the console.
     *
     * @remarks
     * This method iterates over the registered events, counts the number of listeners
     * for each event, and constructs a string that lists each event along with its
     * listener count. The constructed string is then logged to the console as a warning.
     */
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
