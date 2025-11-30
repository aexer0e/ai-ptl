import { Direction, Entity, Vector2, Vector3 } from "@minecraft/server";

export interface Volume {
    min: V3;
    max: V3;
}

export default class V3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(...args) {
        let x: number, y: number, z: number;
        if (args.length === 1) ({ x, y, z } = args[0]);
        else [x, y, z] = args;

        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone(): V3 {
        return new V3(this.x, this.y, this.z);
    }

    static getCenterOf(a: Vector3, b: Vector3): V3 {
        return new V3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    }

    static getCenterOfVolume(volume: Volume): V3 {
        return this.getCenterOf(volume.min, volume.max);
    }

    static asString(vector3: Vector3): string {
        return `${vector3.x} ${vector3.y} ${vector3.z}`;
    }

    static getCenterOfXY(a: Vector3, b: Vector3): V3 {
        return new V3((a.x + b.x) / 2, a.y, (a.z + b.z) / 2);
    }

    static lerp(a: Vector3, b: Vector3, t: number): V3 {
        return new V3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    }

    static direction(a: Vector3, b: Vector3): V3 {
        return new V3(b.x - a.x, b.y - a.y, b.z - a.z).normalize();
    }

    clean() {
        if (isNaN(this.x)) this.x = 0;
        if (isNaN(this.y)) this.y = 0;
        if (isNaN(this.z)) this.z = 0;
        return this;
    }

    asVolume(size: number): Volume {
        return { min: this.offset(-size / 2), max: this.offset(size / 2) };
    }

    asVolumeSized(xSize: number, ySize: number, zSize: number): Volume {
        return { min: this.add(-xSize / 2, -ySize / 2, -zSize / 2), max: this.add(xSize / 2, ySize / 2, zSize / 2) };
    }

    asYawPitch() {
        const yaw = -Math.atan2(this.x, this.z) * (180 / Math.PI);
        const pitch = Math.asin(this.y) * (180 / Math.PI);
        return { yaw, pitch };
    }

    asRotation() {
        const rotation = this.asYawPitch();
        if (isNaN(rotation.pitch)) rotation.pitch = 0;
        if (isNaN(rotation.yaw)) rotation.yaw = 0;
        return { y: rotation.yaw, x: rotation.pitch };
    }

    rotateYaw(theta: number) {
        const x = this.x * Math.cos(theta) - this.z * Math.sin(theta);
        const z = this.x * Math.sin(theta) + this.z * Math.cos(theta);
        return new V3(x, this.y, z);
    }

    hash() {
        MathUtil.hash(this.asString());
    }

    toGrid(): V3 {
        const x = Math.floor(this.x) + 0.5;
        const y = Math.floor(this.y);
        const z = Math.floor(this.z) + 0.5;
        return new V3(x, y, z);
    }

    toGridSelf() {
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z) + 0.5;
        return this;
    }

    lerp(other: Vector3, t: number): V3 {
        return new V3(this.x + (other.x - this.x) * t, this.y + (other.y - this.y) * t, this.z + (other.z - this.z) * t);
    }

    floor() {
        return new V3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    }

    toString(): string {
        return `${this.x} ${this.y} ${this.z}`;
    }

    static toString(vector3: Vector3): string {
        return `${vector3.x} ${vector3.y} ${vector3.z}`;
    }

    static isLocationInViewDirection(cameraLocation: Vector3, cameraDirection: Vector3, targetLocation: Vector3, fov: number = 0.5) {
        const selfDirection = new V3(cameraDirection).normalize();
        const directionToTarget = new V3(targetLocation).subtractV3(cameraLocation).normalize();
        return selfDirection.dot(directionToTarget) >= fov;
    }

    map(fn: (value: number, index: number) => number): V3 {
        return new V3(fn(this.x, 0), fn(this.y, 1), fn(this.z, 2));
    }

    add(x: number, y: number, z: number): V3 {
        return new V3(this.x + x, this.y + y, this.z + z);
    }

    offset(n: number): V3 {
        return new V3(this.x + n, this.y + n, this.z + n);
    }

    addY(y: number): V3 {
        return new V3(this.x, this.y + y, this.z);
    }

    multiplyY(y: number): V3 {
        return new V3(this.x, this.y * y, this.z);
    }

    addV3(other: Vector3): V3 {
        return new V3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    applyRandomOffset(offsetRanges: Vector3): V3 {
        const x = Math.random() * offsetRanges.x * 2 - offsetRanges.x;
        const y = Math.random() * offsetRanges.y * 2 - offsetRanges.y;
        const z = Math.random() * offsetRanges.z * 2 - offsetRanges.z;
        return this.add(x, y, z);
    }

    addSelf(x: number, y: number, z: number): V3 {
        this.x += x;
        this.y += y;
        this.z += z;
        return this;
    }

    subtract(x: number, y: number, z: number): V3 {
        return new V3(this.x - x, this.y - y, this.z - z);
    }

    subtractNumber(n: number): V3 {
        return new V3(this.x - n, this.y - n, this.z - n);
    }

    subtractV3(other: Vector3): V3 {
        return new V3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    mapSelf(fn: (value: number, index: number) => number): V3 {
        this.x = fn(this.x, 0);
        this.y = fn(this.y, 1);
        this.z = fn(this.z, 2);
        return this;
    }

    asString() {
        return `${this.x} ${this.y} ${this.z}`;
    }

    max(max: number): V3 {
        return new V3(Math.min(this.x, max), Math.min(this.y, max), Math.min(this.z, max));
    }

    cross(other: Vector3): V3 {
        return new V3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    }

    asVector3() {
        return { x: this.x, y: this.y, z: this.z };
    }

    inVolume(volume: { min: Vector3; max: Vector3 }, wiggleroom = 0) {
        return (
            this.x >= volume.min.x - wiggleroom &&
            this.x <= volume.max.x + wiggleroom &&
            this.y >= volume.min.y - wiggleroom &&
            this.y <= volume.max.y + wiggleroom &&
            this.z >= volume.min.z - wiggleroom &&
            this.z <= volume.max.z + wiggleroom
        );
    }

    inAnyVolume(volumes: { min: Vector3; max: Vector3 }[], wiggleroom = 0) {
        return volumes.some((volume) => this.inVolume(volume, wiggleroom));
    }

    dot(other: Vector3) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    static inVolume(volume: { min: Vector3; max: Vector3 }, point: Vector3, wiggleroom = 0) {
        return (
            point.x >= volume.min.x - wiggleroom &&
            point.x <= volume.max.x + wiggleroom &&
            point.y >= volume.min.y - wiggleroom &&
            point.y <= volume.max.y + wiggleroom &&
            point.z >= volume.min.z - wiggleroom &&
            point.z <= volume.max.z + wiggleroom
        );
    }

    static random(min: number, max: number) {
        const x = Math.random() * (max - min) + min;
        const y = Math.random() * (max - min) + min;
        const z = Math.random() * (max - min) + min;
        return new V3(x, y, z);
    }

    static randomPosY(min: number, max: number) {
        const x = Math.random() * (max - min) + min;
        const y = Math.random() * (max - min) + min;
        const z = Math.random() * (max - min) + min;
        return new V3(x, Math.abs(y), z);
    }

    static randomNegY(min: number, max: number) {
        const x = Math.random() * (max - min) + min;
        const y = Math.abs(Math.random() * (max - min) + min) * -1;
        const z = Math.random() * (max - min) + min;
        return new V3(x, y, z);
    }

    static randomPosYInc(min: number, max: number) {
        const x = Math.random() * (max - min) + min;
        const y = (Math.random() * (max - min) + min) * 1.3;
        const z = Math.random() * (max - min) + min;
        return new V3(x, Math.abs(y), z);
    }

    static randomNoY(min: number, max: number) {
        const x = Math.random() * (max - min) + min;
        const y = 0;
        const z = Math.random() * (max - min) + min;
        return new V3(x, y, z);
    }

    randomizeSigns() {
        this.x = Math.random() < 0.5 ? this.x : -this.x;
        this.y = Math.random() < 0.5 ? this.y : -this.y;
        this.z = Math.random() < 0.5 ? this.z : -this.z;
        return this;
    }

    static randomRadiusRange(min: number, max: number) {
        return this.random(min, max).randomizeSigns();
    }

    static randomPointInVolume(volume: { min: Vector3; max: Vector3 }) {
        const x = Math.random() * (volume.max.x - volume.min.x) + volume.min.x;
        const y = Math.random() * (volume.max.y - volume.min.y) + volume.min.y;
        const z = Math.random() * (volume.max.z - volume.min.z) + volume.min.z;

        return new V3(x, y, z);
    }

    sharesBlockWith(other: Vector3): boolean {
        if (Math.floor(this.x) !== Math.floor(other.x)) return false;
        if (Math.floor(this.y) !== Math.floor(other.y)) return false;
        if (Math.floor(this.z) !== Math.floor(other.z)) return false;
        return true;
    }

    static sharesBlockWith(a: Vector3, b: Vector3): boolean {
        if (Math.floor(a.x) !== Math.floor(b.x)) return false;
        if (Math.floor(a.y) !== Math.floor(b.y)) return false;
        if (Math.floor(a.z) !== Math.floor(b.z)) return false;
        return true;
    }

    getRotationTo(location: Vector3): Vector2 {
        return new V3(location).subtractV3(this).normalize().asRotation();
    }

    static getRotationTo(a: Vector3, b: Vector3): Vector2 {
        return new V3(b).subtractV3(a).normalize().asRotation();
    }

    multiply(other: number): V3 {
        return new V3(this.x * other, this.y * other, this.z * other);
    }

    multiplyV3(other: Vector3): V3 {
        return new V3(this.x * other.x, this.y * other.y, this.z * other.z);
    }

    static fromEntity(entity: Entity) {
        return new V3(entity.location);
    }

    static fromDirection(direction: Direction): V3 {
        switch (direction) {
            case Direction.North:
                return new V3(0, 0, -1);
            case Direction.East:
                return new V3(1, 0, 0);
            case Direction.South:
                return new V3(0, 0, 1);
            case Direction.West:
                return new V3(-1, 0, 0);
            case Direction.Up:
                return new V3(0, 1, 0);
            case Direction.Down:
                return new V3(0, -1, 0);
            default:
                throw new Error(`Unknown direction ${direction}`);
        }
    }

    static fromYawPitch(yaw: number, pitch: number) {
        const x = Math.sin(yaw) * Math.cos(pitch);
        const y = Math.sin(pitch);
        const z = Math.cos(yaw) * Math.cos(pitch);
        return new V3(x, y, z);
    }

    static fromYaw(yaw: number) {
        return new V3(Math.sin(yaw), 0, Math.cos(yaw));
    }

    static grid(...args) {
        return new V3(...args).toGridSelf();
    }

    static isVector3(obj: unknown): obj is Vector3 {
        return typeof obj === "object" && obj !== null && "x" in obj && "y" in obj && "z" in obj;
    }

    distanceTo(other: Vector3): number {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2) + Math.pow(this.z - other.z, 2));
    }

    setX(x: number) {
        return new V3(x, this.y, this.z);
    }

    setY(y: number) {
        return new V3(this.x, y, this.z);
    }

    setZ(z: number) {
        return new V3(this.x, this.y, z);
    }

    override(other: { x?: number; y?: number; z?: number }) {
        return new V3(other.x ?? this.x, other.y ?? this.y, other.z ?? this.z);
    }

    static cleanVolume(volume: { min: Vector3; max: Vector3 }) {
        const min = new V3(
            Math.min(volume.min.x, volume.max.x),
            Math.min(volume.min.y, volume.max.y),
            Math.min(volume.min.z, volume.max.z)
        );
        const max = new V3(
            Math.max(volume.min.x, volume.max.x),
            Math.max(volume.min.y, volume.max.y),
            Math.max(volume.min.z, volume.max.z)
        );
        return { min, max };
    }

    static equals(a: Vector3, b: Vector3) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }

    static volumeAsString(volume: { min: Vector3; max: Vector3 }) {
        return `${this.toString(volume.min)} ${this.toString(volume.max)}`;
    }

    normalize() {
        const length = this.length();
        return new V3(this.x / length, this.y / length, this.z / length).clean();
    }

    toNonZeroSelf() {
        if (this.x === 0) this.x = 0.0001;
        if (this.y === 0) this.y = 0.0001;
        if (this.z === 0) this.z = 0.0001;
    }

    static fromString(str: string) {
        const [x, y, z] = str.split(" ").map(Number);
        return new V3(x, y, z);
    }

    static raycastIntersectsVolume(location: V3, direction: V3, volume: { min: Vector3; max: Vector3 }) {
        direction.toNonZeroSelf();
        direction = direction.normalize();
        const invDir = new V3(1 / direction.x, 1 / direction.y, 1 / direction.z);

        // Calculate the intersection intervals along each axis
        const tMinX = (volume.min.x - location.x) * invDir.x;
        const tMaxX = (volume.max.x - location.x) * invDir.x;

        const tMinY = (volume.min.y - location.y) * invDir.y;
        const tMaxY = (volume.max.y - location.y) * invDir.y;

        const tMinZ = (volume.min.z - location.z) * invDir.z;
        const tMaxZ = (volume.max.z - location.z) * invDir.z;

        // Find the intersection interval along all three axes
        const tMin = Math.max(Math.max(Math.min(tMinX, tMaxX), Math.min(tMinY, tMaxY)), Math.min(tMinZ, tMaxZ));
        const tMax = Math.min(Math.min(Math.max(tMinX, tMaxX), Math.max(tMinY, tMaxY)), Math.max(tMinZ, tMaxZ));

        // Check if there is a valid intersection
        if (tMax >= tMin && tMax >= 0) {
            // Intersection occurred
            return true;
        }

        // No intersection
        return false;
    }

    static raycastIntersectsSphere(location: V3, direction: V3, sphereLocation: V3, radius: number) {
        direction.toNonZeroSelf();
        direction = direction.normalize();
        const L = sphereLocation.subtractV3(location);
        const tca = L.dot(direction);
        if (tca < 0) return false;
        const d2 = L.dot(L) - tca * tca;
        return d2 <= radius * radius;
    }

    /* Vector Polyfill */
    static get zero() {
        return new V3(0, 0, 0);
    }

    static add(a: Vector3, b: Vector3) {
        return new V3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    static multiply(a: Vector3, b: number) {
        return new V3(a.x * b, a.y * b, a.z * b);
    }

    length(): number {
        let result = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (isNaN(result)) result = 0;
        return result;
    }

    lengthXZ(): number {
        let result = Math.sqrt(this.x * this.x + this.z * this.z);
        if (isNaN(result)) result = 0;
        return result;
    }

    moveTowards(target: Vector3, distance: number) {
        const a = new V3(this);
        const b = new V3(target);
        const vector = b.subtractV3(a);
        const magnitude = vector.length();
        if (magnitude <= distance || magnitude === 0) return b;
        return a.addV3(vector.divide(magnitude).multiply(distance));
    }

    moveTowardsDirection(direction: Vector3, distance: number) {
        return this.addV3(new V3(direction).normalize().multiply(distance));
    }

    static distance(a: Vector3, b: Vector3): number {
        return new V3(a).subtract(b.x, b.y, b.z).length();
    }

    static distanceXZ(a: Vector3, b: Vector3): number {
        return new V3(a.x, 0, a.z).subtract(b.x, 0, b.z).length();
    }

    equals(other: Vector3): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    divide(b: number): V3 {
        return new V3(this.x / b, this.y / b, this.z / b);
    }

    static divide(a: Vector3, b: number): V3 {
        return new V3(a.x / b, a.y / b, a.z / b);
    }

    static subtract(a: Vector3, b: Vector3): V3 {
        return new V3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    static yawAsXZ(yaw: number) {
        return new V3(Math.sin(yaw), 0, Math.cos(yaw));
    }
}
