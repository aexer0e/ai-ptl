import { Entity, Vector3 } from "@minecraft/server";
import MobComponentManager, { MobComponentInstance, MobComponentKey } from "MobComponents/MobComponentManager";
import Dragon from "MobComponents/MobComponents/Dragons/Dragon";
import V3 from "Wrappers/V3";

/**
 * Extends the Entity and Player prototypes with utility methods for validation, component access, and distance calculations.
 */
declare module "@minecraft/server" {
    interface Entity {
        /**
         * Checks if the entity is valid (not removed or dead).
         * @returns True if the entity is valid.
         */
        valid: () => this is Entity;
        /**
         * Returns the entity if valid, otherwise null.
         * @returns The entity if valid, or null.
         */
        try: () => Entity | null;
        /**
         * Gets a mob component instance attached to this entity.
         * @param mobComponent The component key.
         * @returns The component instance or undefined.
         */
        getMobComponent<T extends MobComponentKey>(mobComponent: T): MobComponentInstance<T>;
        /**
         * Gets the dragon mob component if present. (Zenith only, should be removed from here)
         * @returns The Dragon component or undefined.
         */
        getDragonMobComponent(): Dragon | undefined;
        /**
         * Gets the distance to another entity.
         * @param entity The other entity.
         * @returns The distance between entities.
         */
        distanceTo: (entity: Entity) => number;
        /**
         * Gets the distance to a location.
         * @param location The location vector.
         * @returns The distance to the location.
         */
        distanceToLocation: (location: Vector3) => number;
    }
    interface Player {
        /**
         * Checks if the player is valid (not removed or dead).
         * @returns True if the player is valid.
         */
        valid: () => this is Player;
        /**
         * Returns the player if valid, otherwise null.
         * @returns The player if valid, or null.
         */
        try: () => Player | null;
        /**
         * Gets a mob component instance attached to this player.
         * @param mobComponent The component key.
         * @returns The component instance or undefined.
         */
        getMobComponent<T extends MobComponentKey>(mobComponent: T): MobComponentInstance<T>;
    }
} // <-- Add missing semicolon after module augmentation or declaration
/**
 * Checks if the entity is valid (not removed or dead).
 */
Entity.prototype.valid = function (this: Entity): this is Entity {
    try {
        return this.isValid();
    } catch {}
    return false;
};

/**
 * Returns the entity if valid, otherwise null.
 */
Entity.prototype.try = function (this: Entity) {
    try {
        return this.isValid() ? this : null;
    } catch {}
    return null;
};

/**
 * Gets a mob component instance attached to this entity.
 */
Entity.prototype.getMobComponent = function <T extends MobComponentKey>(this: Entity, mobComponent: T): MobComponentInstance<T> {
    return (MobComponentManager.mobComponents[this.id]?.[mobComponent] as MobComponentInstance<T>) || undefined;
};

/**
 * Gets the dragon mob component if present.
 */
Entity.prototype.getDragonMobComponent = function (this: Entity): Dragon | undefined {
    if (MobComponentManager.mobComponents[this.id])
        return Object.values(MobComponentManager.mobComponents[this.id]).find((e) => e instanceof Dragon) as Dragon | undefined;
    else return undefined;
};

/**
 * Gets the distance to another entity.
 */
Entity.prototype.distanceTo = function (this: Entity, entity: Entity) {
    return V3.distance(this.location, entity.location);
};

/**
 * Gets the distance to a location.
 */
Entity.prototype.distanceToLocation = function (this: Entity, location: Vector3) {
    return V3.distance(this.location, location);
};
