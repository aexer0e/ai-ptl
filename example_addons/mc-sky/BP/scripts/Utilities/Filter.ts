import { Player, Vector3 } from "@minecraft/server";
import V3 from "Wrappers/V3";
import InventoryUtil from "./InventoryUtil";

export default class Filter {
    static playerInRadius(location: V3, radius: number) {
        return (player: Player) => this.locationInSphere(location, radius)(player.location);
    }

    static playerYInRange(minY: number, maxY: number) {
        return (player: Player) => this.numberInRange(minY, maxY)(player.location.y);
    }

    static isBottomBlock(blockTypeId: string) {
        return (player: Player) => {
            const bottomLocation = new V3(player.location).setY(-64);
            return player.dimension.getBlock(bottomLocation)?.typeId === blockTypeId;
        };
    }

    static isHandEmpty() {
        return (player: Player) => !InventoryUtil.selectedItem(player);
    }

    static inverse<T>(filter: (arg: T) => boolean) {
        return (arg: T) => !filter(arg);
    }

    static locationInSphere(pivot: Vector3, radius: number) {
        return (location: Vector3) => V3.distance(location, pivot) < radius;
    }

    static numberInRange(min: number, max: number) {
        return (number: number) => number >= min && number <= max;
    }

    static random(chance: number) {
        return () => Math.random() < chance;
    }

    static isInBiome(biome: string) {
        return () => !!biome || true;
    }

    static always() {
        return () => true;
    }

    static never() {
        return () => false;
    }
}

/*
type PlayerFilters<methods extends keyof typeof Filter = keyof typeof Filter> = {
    [method in methods]: typeof Filter[method] extends ((location: V3, radius: number) => (player: Player) => boolean) ? method : never;
};
const a: PlayerFilters = Filter.playerInRadius;
a;
*/
