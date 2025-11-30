import { Vector2 } from "@minecraft/server";
import V2 from "Wrappers/V2";
import V3 from "Wrappers/V3";

/**
 * Math utility class providing common math operations, randomization, and vector/rotation helpers.
 */
class _MathUtil {
    /**
     * Clamps a value between min and max.
     * @param value The value to clamp.
     * @param min The minimum value.
     * @param max The maximum value.
     */
    static clamp(value: number, min: number, max: number) {
        if (isNaN(value)) return min;
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Calculates the logarithm of a value with a given base.
     * @param value The value.
     * @param base The base.
     */
    static log(value: number, base: number) {
        if (value <= 0) return 0;
        return Math.log(value) / Math.log(base);
    }

    /**
     * Linearly interpolates between a and b by alpha.
     * @param a The start value.
     * @param b The end value.
     * @param alpha The interpolation factor.
     */
    static lerp(a: number, b: number, alpha: number) {
        return a + alpha * (b - a);
    }

    /**
     * Snaps a number to the nearest step.
     * @param number The number to snap.
     * @param stepsCount The number of steps.
     * @param max The maximum value.
     */
    static snapNumber(number: number, stepsCount: number, max: number) {
        const step = max / stepsCount;
        return Math.round(number / step) * step;
    }

    /**
     * Checks if a value is within a range.
     * @param value The value to check.
     * @param min The minimum value.
     * @param max The maximum value.
     */
    static isInRange(value: number, min: number, max: number) {
        return value >= min && value <= max;
    }

    /**
     * Converts a rotation (pitch/yaw) to a vector.
     * @param rotation The rotation as Vector2.
     */
    static rotationToVector(rotation: Vector2): Vector2 {
        const yaw = rotation.y * (Math.PI / 180);
        const pitch = rotation.x * (Math.PI / 180);

        const x = Math.sin(yaw * -1) * Math.cos(pitch);
        const y = Math.sin(pitch * -1);
        const z = Math.cos(yaw) * Math.cos(pitch);
        return new V3(x, y, z);
    }

    /**
     * Converts a vector to a rotation (pitch/yaw).
     * @param vector The vector.
     */
    static vectorToRotation(vector: V3): Vector2 {
        const x = vector.x;
        const y = vector.y;
        const z = vector.z;

        const yaw = Math.atan2(x, z) * (180 / Math.PI);
        const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);

        return new V2(pitch, yaw);
    }

    /**
     * Returns true with the given probability (0-1).
     * @param chance The probability.
     */
    static chance(chance: number) {
        return Math.random() < chance;
    }

    /**
     * Returns a random float between min and max.
     * @param min The minimum value.
     * @param max The maximum value.
     */
    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Returns a random integer between min and max.
     * @param min The minimum value.
     * @param max The maximum value.
     */
    static randomInt(min: number, max: number) {
        return Math.round(this.random(min, max));
    }

    /**
     * Chooses a random element from an array.
     * @param array The array to choose from.
     */
    static choose(array: Array<number>) {
        const length = array.length - 1;
        const choice = Math.round(_MathUtil.random(0, length));
        return array[choice];
    }

    /**
     * Maps a value from one range to another.
     * @param input The input value.
     * @param input_min The input range min.
     * @param input_max The input range max.
     * @param output_min The output range min.
     * @param output_max The output range max.
     */
    static rangeMap(input: number, input_min: number, input_max: number, output_min: number, output_max) {
        return output_min + ((output_max - output_min) / (input_max - input_min)) * (input - input_min);
    }

    /**
     * Hashes a string to a signed integer.
     * @param str The string to hash.
     */
    static hash(str: string) {
        return str.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
        }, 0);
    }

    /**
     * Hashes a string to a positive integer.
     * @param str The string to hash.
     */
    static hashPositiveInt(str: string) {
        return Math.abs(this.hash(str));
    }

    /**
     * Hashes a string to a float in [0, 1].
     * @param str The string to hash.
     */
    static hash01(str: string) {
        return Math.abs(this.hash(str)) / 2147483647;
    }

    /**
     * Linearly interpolates between a and b by alpha, clamped to [a, b].
     * @param a The start value.
     * @param b The end value.
     * @param alpha The interpolation factor.
     */
    static lerpBound(a: number, b: number, alpha: number) {
        return MathUtil.clamp(MathUtil.lerp(a, b, alpha), a, b);
    }

    /**
     * Checks if a value is within a range (inclusive).
     * @param input The value to check.
     * @param min The minimum value.
     * @param max The maximum value.
     */
    static withinRange(input: number, min: number, max: number) {
        if (input >= min && input <= max) return true;
        return false;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var MathUtil: Omit<typeof _MathUtil, "prototype">;
}
globalThis.MathUtil = _MathUtil;
