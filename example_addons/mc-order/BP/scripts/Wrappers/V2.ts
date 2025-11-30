import { Vector2 } from "@minecraft/server";

/**
 * @category Wrappers
 */
export default class V2 {
    x: number;
    y: number;

    /**
     * Constructs an a new instance of `V2`.
     *
     * @param {...any[]} args - The arguments to initialize the instance.
     *                          If a single argument is provided, it should be an object with `x` and `y` properties.
     *                          If two arguments are provided, they should be the `x` and `y` values respectively.
     */
    constructor(...args) {
        let x: number, y: number;
        if (args.length === 1) ({ x, y } = args[0]);
        else [x, y] = args;

        this.x = x;
        this.y = y;
    }

    /**
     * Compares this Vector2 instance with another Vector2 instance for equality.
     *
     * @param other - The other Vector2 instance to compare with.
     * @returns `true` if both instances have the same x and y values, otherwise `false`.
     */
    equals(other: Vector2) {
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Compares two Vector2 objects for equality.
     *
     * @param a - The first Vector2 object to compare.
     * @param b - The second Vector2 object to compare.
     * @returns `true` if both Vector2 objects have the same x and y values, otherwise `false`.
     */
    static equals(a: Vector2, b: Vector2) {
        return a.x === b.x && a.y === b.y;
    }
}
