import { Vector2 } from "@minecraft/server";

export default class V2 {
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
}
