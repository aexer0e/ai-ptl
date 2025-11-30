import { Vector2 } from "@minecraft/server";

class _V2 {
    x: number;
    y: number;

    constructor(...args) {
        let x: number, y: number;
        if (args.length === 1) ({ x, y } = args[0]);
        else [x, y] = args;

        this.x = x;
        this.y = y;
    }

    equals(other: Vector2) {
        return this.x === other.x && this.y === other.y;
    }

    static equals(a: Vector2, b: Vector2) {
        return a.x === b.x && a.y === b.y;
    }

    abs(): _V2 {
        return new _V2(Math.abs(this.x), Math.abs(this.y));
    }
}

declare global {
    // eslint-disable-next-line no-var
    var V2: typeof _V2;
    type V2 = _V2;
}
globalThis.V2 = _V2;
export default _V2;
