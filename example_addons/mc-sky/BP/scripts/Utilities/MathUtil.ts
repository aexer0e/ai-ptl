import { system } from "@minecraft/server";
import { Rotation } from "Types/Rotation";
import V3 from "Wrappers/V3";

export default class MathUtil {
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

    static rotationToVector(rotation: Rotation): V3 {
        const yaw = rotation.y * (Math.PI / 180);
        const pitch = rotation.x * (Math.PI / 180);

        const x = Math.sin(yaw * -1) * Math.cos(pitch);
        const y = Math.sin(pitch * -1);
        const z = Math.cos(yaw) * Math.cos(pitch);
        return new V3(x, y, z);
    }

    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
    static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    static chance(chance: number) {
        return Math.random() < chance;
    }

    static choose<T>(array: Array<T>) {
        const length = array.length - 1;
        const choice = Math.round(MathUtil.random(0, length));
        return array[choice] as T;
    }

    static rangeMap(input: number, input_min: number, input_max: number, output_min: number, output_max) {
        return output_min + ((output_max - output_min) / (input_max - input_min)) * (input - input_min);
    }

    static timeSince(timestamp: number) {
        return system.currentTick - timestamp;
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
