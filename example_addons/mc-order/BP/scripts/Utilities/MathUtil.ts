import { Rotation } from "Types/Rotation";
import V2 from "Wrappers/V2";
import V3 from "Wrappers/V3";

/**
 * A utility class providing various mathematical operations and functions.
 *
 * @remarks
 * This class includes static methods for common mathematical calculations
 * and operations that can be used throughout the application.
 *
 * @example
 * ```typescript
 * const result = MathUtil.add(5, 10);
 * console.log(result); // Output: 15
 * ```
 */
export default class MathUtil {
    /**
     * Clamps a number between a minimum and maximum value.
     *
     * @param value - The number to clamp.
     * @param min - The minimum value to clamp to.
     * @param max - The maximum value to clamp to.
     * @returns The clamped value.
     */
    static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Calculates the logarithm of a given value with a specified base.
     *
     * @param value - The number to calculate the logarithm for. Must be greater than 0.
     * @param base - The base of the logarithm.
     * @returns The logarithm of the value with the specified base. Returns 0 if the value is less than or equal to 0.
     */
    static log(value: number, base: number) {
        if (value <= 0) return 0;
        return Math.log(value) / Math.log(base);
    }
    /**
     * Calculates float modulo.
     *
     * @param a - value 1.
     * @param b - value 2.
     */
    static fmod(a: number, b: number) {
        return a - Math.floor(a / b) * b;
    }

    /**
     * Linearly interpolates between two numbers.
     *
     * @param a - The start value.
     * @param b - The end value.
     * @param alpha - The interpolation factor, typically between 0 and 1.
     * @returns The interpolated value.
     */
    static lerp(a: number, b: number, alpha: number) {
        return a + alpha * (b - a);
    }

    static lerpBound(a: number, b: number, alpha: number) {
        return MathUtil.clamp(MathUtil.lerp(a, b, alpha), a, b);
    }

    /**
     * Snaps a given number to the nearest step within a specified range.
     *
     * @param number - The number to be snapped.
     * @param stepsCount - The number of steps to divide the range into.
     * @param max - The maximum value of the range.
     * @returns The snapped number.
     */
    static snapNumber(number: number, stepsCount: number, max: number) {
        const step = max / stepsCount;
        return Math.round(number / step) * step;
    }

    /**
     * Converts a rotation (given in degrees) to a vector.
     *
     * @param rotation - The rotation object containing yaw (y) and pitch (x) in degrees.
     * @returns A vector (V3) representing the direction of the given rotation.
     */
    static rotationToVector(rotation: Rotation): V3 {
        const yaw = rotation.y * (Math.PI / 180);
        const pitch = rotation.x * (Math.PI / 180);

        const x = Math.sin(yaw * -1) * Math.cos(pitch);
        const y = Math.sin(pitch * -1);
        const z = Math.cos(yaw) * Math.cos(pitch);
        return new V3(x, y, z);
    }

    /**
     * Converts a 3D vector to a rotation.
     *
     * @param vector - A vector (V3) to convert.
     * @returns A `Rotation` object representing the pitch and yaw derived from the vector.
     */
    static vectorToRotation(vector: V3): Rotation {
        const x = -vector.x;
        const y = vector.y;
        const z = vector.z;

        const yaw = Math.atan2(x, z) * (180 / Math.PI);
        const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);

        return new V2(pitch, yaw);
    }

    /**
     * Generates a random number between the specified minimum and maximum values.
     *
     * @param min - The minimum value (inclusive).
     * @param max - The maximum value (exclusive).
     * @returns A random number between min (inclusive) and max (exclusive).
     */
    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
    /**
     * Generates a random integer between the specified minimum and maximum values.
     *
     * @param min - The minimum value (inclusive).
     * @param max - The maximum value (exclusive).
     * @returns A random integer between min (inclusive) and max (exclusive).
     */
    static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * Selects a random element from an array of numbers.
     *
     * @param array - The array of numbers to choose from.
     * @returns The randomly selected number from the array.
     */
    static choose(array: Array<number>) {
        const length = array.length - 1;
        const choice = Math.round(MathUtil.random(0, length));
        return array[choice];
    }

    static chance(chance: number) {
        return Math.random() < chance;
    }

    /**
     * Maps a number from one range to another.
     *
     * @param input - The number to map.
     * @param input_min - The minimum value of the input range.
     * @param input_max - The maximum value of the input range.
     * @param output_min - The minimum value of the output range.
     * @param output_max - The maximum value of the output range.
     * @returns The mapped number in the output range.
     */
    static rangeMap(input: number, input_min: number, input_max: number, output_min: number, output_max) {
        return output_min + ((output_max - output_min) / (input_max - input_min)) * (input - input_min);
    }

    /**
     * Generates a hash code for a given string.
     *
     * This function takes a string input and computes a hash code by iterating
     * through each character of the string, applying bitwise operations to
     * accumulate the hash value.
     *
     * @param str - The input string to hash.
     * @returns The computed hash code as a number.
     */
    static hash(str: string) {
        return str.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
        }, 0);
    }

    /**
     * Generates a positive integer hash from the given string.
     *
     * @param str - The input string to hash.
     * @returns A positive integer hash value.
     */
    static hashPositiveInt(str: string) {
        return Math.abs(this.hash(str));
    }

    /**
     * Generates a hash value for the given string and normalizes it to a value between 0 and 1.
     *
     * @param str - The input string to be hashed.
     * @returns A normalized hash value between 0 and 1.
     */
    static hash01(str: string) {
        return Math.abs(this.hash(str)) / 2147483647;
    }

    static seededRNG(seed: string) {
        let hash = 0x811c9dc5; // 32-bit offset basis
        for (let i = 0; i < seed.length; i++) {
            hash ^= seed.charCodeAt(i);
            hash *= 0x01000193; // FNV prime
            hash = hash >>> 0; // Convert to unsigned 32-bit
        }
        return (hash % 100000) / 100000;
    }

    static seededChance(seed: string, chance: number) {
        return MathUtil.seededRNG(seed) < chance;
    }

    /**
     * Checks if a given number is within a specified range.
     *
     * @param input - The number to check.
     * @param min - The minimum value of the range.
     * @param max - The maximum value of the range.
     * @returns `true` if the input is within the range [min, max], inclusive; otherwise, `false`.
     */
    static withinRange(input: number, min: number, max: number) {
        if (input >= min && input <= max) return true;
        return false;
    }
}
