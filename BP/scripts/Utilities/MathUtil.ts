import { Vector2 } from "@minecraft/server";

class _MathUtil {
    static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }

    static log(value: number, base: number) {
        if (value <= 0) return 0;
        return Math.log(value) / Math.log(base);
    }

    static lerp(a: number, b: number, alpha: number) {
        return a + alpha * (b - a);
    }

    static snapNumber(number: number, stepsCount: number, max: number) {
        const step = max / stepsCount;
        return Math.round(number / step) * step;
    }

    static isInRange(value: number, min: number, max: number) {
        return value >= min && value <= max;
    }

    static rotationToVector(rotation: Vector2): Vector2 {
        const yaw = rotation.y * (Math.PI / 180);
        const pitch = rotation.x * (Math.PI / 180);

        const x = Math.sin(yaw * -1) * Math.cos(pitch);
        const y = Math.sin(pitch * -1);
        const z = Math.cos(yaw) * Math.cos(pitch);
        return new V3(x, y, z);
    }

    static vectorToRotation(vector: V3): Vector2 {
        const x = vector.x;
        const y = vector.y;
        const z = vector.z;

        const yaw = Math.atan2(x, z) * (180 / Math.PI);
        const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);

        return new V2(pitch, yaw);
    }

    static chance(chance: number) {
        return Math.random() < chance;
    }

    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min: number, max: number) {
        return Math.round(this.random(min, max));
    }

    static choose(array: Array<number>) {
        const length = array.length - 1;
        const choice = Math.round(_MathUtil.random(0, length));
        return array[choice];
    }

    static rangeMap(input: number, input_min: number, input_max: number, output_min: number, output_max) {
        return output_min + ((output_max - output_min) / (input_max - input_min)) * (input - input_min);
    }

    static hash(str: string) {
        return str.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
        }, 0);
    }

    static hashPositiveInt(str: string) {
        return Math.abs(this.hash(str));
    }

    static hash01(str: string) {
        return Math.abs(this.hash(str)) / 2147483647;
    }

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
