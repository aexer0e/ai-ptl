import { Vector3 } from "@minecraft/server";
import { Volume } from "Wrappers/V3";

export interface StaticVolumeEntry<T> {
    volume: Volume;
    data: T;
}
export interface StaticLocationEntry<T> {
    location: Vector3;
    data: T;
}

class _SpatialHashGrid<T> {
    private hashMap: Map<number, Set<T>> = new Map();
    private cellSize: number;

    private constructor(cellSize: number) {
        this.cellSize = cellSize;
    }

    static fromLocationEntries<T>(cellSize: number, entries: StaticLocationEntry<T>[]) {
        const grid = new _SpatialHashGrid<T>(cellSize);
        grid.fillHashLocation(entries);
        return grid;
    }

    static fromVolumeEntries<T>(cellSize: number, entries: StaticVolumeEntry<T>[]) {
        const grid = new _SpatialHashGrid<T>(cellSize);
        grid.fillHash(entries);
        return grid;
    }

    public getEntriesAt(x: number, y: number, range: number = 0): T[] {
        const entries = new Set<T>();
        const minX = x - range;
        const minY = y - range;
        const maxX = x + range;
        const maxY = y + range;

        for (let i = minX; i < maxX; i += this.cellSize) {
            for (let j = minY; j < maxY; j += this.cellSize) {
                const key = this.hashKey(i, j);
                const set = this.hashMap.get(key);
                if (set) {
                    for (const entry of set) {
                        entries.add(entry);
                    }
                }
            }
        }

        return Array.from(entries);
    }

    private fillHash(entries: StaticVolumeEntry<T>[]) {
        for (const entry of entries) {
            const { min, max } = entry.volume;

            for (let x = min.x; x < max.x; x += this.cellSize) {
                for (let y = min.z; y < max.z; y += this.cellSize) {
                    this.addEntry(x, y, entry.data);
                }
            }
        }
    }

    private fillHashLocation(entries: StaticLocationEntry<T>[]) {
        for (const entry of entries) {
            const { x, z } = entry.location;
            this.addEntry(x, z, entry.data);
        }
    }

    private addEntry(x: number, y: number, data: T) {
        const key = this.hashKey(x, y);
        const set = this.hashMap.get(key);
        if (set) set.add(data);
        else this.hashMap.set(key, new Set([data]));
    }

    private hashKey(x: number, y: number) {
        const width = Math.floor(x / this.cellSize);
        const height = Math.floor(y / this.cellSize);
        return width + height * 100000;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var SpatialHashGrid: Omit<typeof _SpatialHashGrid, "prototype">;
}
globalThis.SpatialHashGrid = _SpatialHashGrid;
