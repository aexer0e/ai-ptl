import { system } from "@minecraft/server";

type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>;

class _GenericBuffer<T, N extends number> {
    private readonly shouldLog = false;
    private buffer: T[] = [];

    constructor(
        public size: N,
        public defaultValue?: T
    ) {
        if (this.shouldLog)
            system.runInterval(() => {
                console.warn(this.buffer.length, JSON.stringify(this.buffer));
            });
    }

    push(value: T) {
        this.buffer.unshift(value);
        if (this.buffer.length > this.size) {
            this.buffer.pop();
        }
    }

    get(index: Enumerate<N>): T | undefined {
        // @ts-ignore
        return this.buffer.length <= index ? this.defaultValue : this.buffer[index];
    }
}

declare global {
    // eslint-disable-next-line no-var
    var GenericBuffer: typeof _GenericBuffer;
}
globalThis.GenericBuffer = _GenericBuffer;
