import {
    Dimension,
    Direction,
    Entity,
    EntityApplyDamageByProjectileOptions,
    EntityApplyDamageOptions,
    EntityHealthComponent,
    EntityQueryOptions,
    ItemStack,
    Player,
    Vector2,
    Vector3,
    world,
} from "@minecraft/server";
import { Maybe } from "Types/Maybe";
import { Rotation } from "Types/Rotation";
import DebugTimer from "./DebugTimer";

export default class EntityUtil {
    /**
     * Retrieves a list of entities based on the provided query options within the specified dimension.
     *
     * @param query - The options to filter and query entities.
     * @param dimension - The dimension in which to search for entities.
     * @returns An array of entities that match the query options within the given dimension.
     */
    static getEntities(query: EntityQueryOptions, dimension: Dimension): Entity[] {
        DebugTimer.countStart("EntityUtilGetEntities");
        const result = dimension.getEntities(query);
        DebugTimer.countEnd();
        return result;
    }

    /**
     * Retrieves all players in the specified dimension.
     *
     * @param dimension - The dimension from which to retrieve players.
     * @returns An array of players in the specified dimension.
     */
    static getPlayers(dimension: Dimension): Player[] {
        return this.getEntities({ type: "player" }, dimension) as Player[];
    }

    /**
     * Retrieves the nearest player to a given location within a specified dimension.
     *
     * @param location - The location to search for the nearest player.
     * @param dimension - The dimension in which to search for the nearest player.
     * @returns The nearest player to the specified location, or `undefined` if no players are found.
     */
    static getNearestPlayer(location: Vector3, dimension: Dimension, maxDistance?: number | undefined): Player | undefined {
        const players = this.getEntities(
            {
                type: "player",
                closest: 1,
                location,
                maxDistance,
            },
            dimension
        );

        if (players.length === 0) return undefined;
        return players[0] as Player;
    }

    /**
     * Retrieves an array of players within a specified radius from a given location in a specified dimension.
     *
     * @param location - The central point from which to measure the radius.
     * @param radius - The maximum distance from the location to search for players.
     * @param dimension - The dimension in which to search for players.
     * @returns An array of players found within the specified radius from the given location.
     */
    static getNearbyPlayers(location: Vector3, radius: number, dimension: Dimension): Player[] {
        return this.getEntities({ type: "player", location, maxDistance: radius }, dimension) as Player[];
    }

    /**
     * Kills all entities that match the given query in the specified dimension.
     *
     * @param query - The query options to filter the entities.
     * @param dimension - The dimension in which to search for entities.
     */
    static killEntities(query: EntityQueryOptions, dimension: Dimension): void {
        const entities = this.getEntities(query, dimension);
        for (const entity of entities) {
            entity.kill();
        }
    }

    /**
     * Removes entities from the specified dimension based on the given query options.
     *
     * @param query - The options to query entities.
     * @param dimension - The dimension from which entities will be removed.
     */
    static removeEntities(query: EntityQueryOptions, dimension: Dimension): void {
        const entities = this.getEntities(query, dimension);
        for (const entity of entities) {
            entity.remove();
        }
    }

    /**
     * Spawns an item in the specified dimension at the given location.
     *
     * @param itemStack - The item stack to be spawned.
     * @param location - The location where the item should be spawned.
     * @param dimension - The dimension in which the item should be spawned.
     * @returns The spawned item entity.
     */
    static spawnItem(itemStack: ItemStack, location: Vector3, dimension: Dimension) {
        return dimension.spawnItem(itemStack, location);
    }

    /**
     * Spawns an entity of the specified type at the given location within the specified dimension.
     *
     * @param type - The type of entity to spawn.
     * @param location - The location where the entity should be spawned.
     * @param dimension - The dimension in which the entity should be spawned.
     * @returns The spawned entity.
     */
    static spawnEntity(type: string, location: Vector3, dimension: Dimension): Entity {
        return dimension.spawnEntity(type, location);
    }

    /**
     * Spawns an entity of the specified type at the given location with the specified rotation in the given dimension.
     *
     * @param type - The type of entity to spawn.
     * @param location - The location where the entity should be spawned.
     * @param rotation - The rotation to apply to the spawned entity.
     * @param dimension - The dimension in which to spawn the entity.
     * @returns The spawned entity.
     */
    static spawnEntityRotated(type: string, location: Vector3, rotation: Vector2, dimension: Dimension): Entity {
        const entity = dimension.spawnEntity(type, location);
        entity.teleport(location, { rotation });
        return entity;
    }

    /**
     * Spawns an entity of the specified type at the given location and sets its direction.
     *
     * @param type - The type of entity to spawn.
     * @param location - The location where the entity will be spawned.
     * @param direction - The direction the entity will face after being spawned.
     * @param dimension - The dimension in which the entity will be spawned.
     * @returns The spawned entity with the specified direction.
     */
    static spawnEntityWithDirection(type: string, location: Vector3, direction: Direction, dimension: Dimension): Entity {
        const entity: Entity = dimension.spawnEntity(type, location);
        const rotation = EntityUtil.convertDirectionToRotation(direction);
        entity.setRotation(rotation);
        return entity;
    }

    /**
     * Spawns a specified number of entities of a given type at a specified location within a given dimension.
     *
     * @param type - The type of entity to spawn.
     * @param location - The location where the entities should be spawned.
     * @param amount - The number of entities to spawn.
     * @param dimension - The dimension in which the entities should be spawned.
     * @returns An array of the spawned entities.
     */
    static spawnEntities(type: string, location: Vector3, amount: number, dimension: Dimension): Entity[] {
        const entities: Entity[] = [];
        for (let i = 0; i < amount; i++) {
            entities.push(this.spawnEntity(type, location, dimension));
        }
        return entities;
    }

    /**
     * Checks if the given entity is valid, aka is still alive, connected to the server, or loaded in a chunk.
     *
     * @param entity - The entity to check.
     * @returns `true` if the entity is valid, otherwise `false`.
     */
    static isValid(entity: Maybe<Entity>): entity is Entity {
        try {
            // @ts-expect-error
            const result = entity.isValid();
            return result;
        } catch (e) {
            return false;
        }
    }

    /**
     * Checks if the given entity is alive.
     *
     * @param entity - The entity to check.
     * @returns `true` if the entity is alive, `false` otherwise.
     */
    static isAlive(entity: Entity | null): boolean {
        if (!this.isValid(entity)) return false;
        const healthComponent = entity.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
        if (!healthComponent) return true;
        entity = entity as Entity;
        return healthComponent.currentValue > 0;
    }

    /**
     * Determines if an entity can see a target entity within a specified maximum distance.
     *
     * @param entity - The entity that is attempting to see the target.
     * @param target - The target entity that is being looked for.
     * @param maxDistance - The maximum distance within which the entity can see the target.
     * @returns `true` if the entity can see the target within the specified distance, otherwise `false`.
     */
    static canSeeEntity(entity: Entity, target: Entity, maxDistance: number): boolean {
        const result = !!entity.getEntitiesFromViewDirection({ type: target.typeId, maxDistance }).find((e) => e.entity.id === target.id);
        return result;
    }

    /**
     * Checks if the given entity belongs to any of the specified families within the given dimension.
     *
     * @param entity - The entity to check.
     * @param families - An array of family names to check against.
     * @param dimension - The dimension in which to check for the entity's families.
     * @returns `true` if the entity belongs to any of the specified families, otherwise `false`.
     */
    static hasFamilies(entity: Entity, families: string[], dimension: Dimension): boolean {
        return this.getEntities({ type: entity.typeId, families }, dimension).length > 0;
    }

    /**
     * Retrieves a player by their unique identifier.
     *
     * @param id - The unique identifier of the player.
     * @returns The player object if found, otherwise `undefined`.
     */
    static getPlayerById(id: string): Player | undefined {
        return world.getAllPlayers().find((player) => player.id === id);
    }

    /**
     * Retrieves an entity by its unique identifier within a specified dimension.
     *
     * @param id - The unique identifier of the entity to retrieve.
     * @param dimension - The dimension in which to search for the entity.
     * @returns The entity with the specified identifier, or `undefined` if no such entity is found.
     */
    static getEntityById(id: string): Entity | undefined {
        return world.getEntity(id);
    }

    /**
     * Sets the spawn point for a given player.
     *
     * @param player - The player whose spawn point is to be set.
     * @param location - The location vector (x, y, z) where the spawn point will be set.
     * @param dimension - The dimension in which the spawn point will be set.
     */
    static setSpawnPoint(player: Player, location: Vector3, dimension: Dimension) {
        player.setSpawnPoint({
            dimension: dimension,
            x: location.x,
            y: location.y,
            z: location.z,
        });
    }

    /**
     * Converts a given direction to its corresponding rotation.
     *
     * @param direction - The direction to convert.
     * @returns An object representing the rotation with properties `x` and `y`.
     *
     * @example
     * ```typescript
     * const rotation = EntityUtil.convertDirectionToRotation(Direction.North);
     * console.log(rotation); // { x: 0, y: 180 }
     * ```
     */
    static convertDirectionToRotation(direction: Direction): Rotation {
        switch (direction) {
            case Direction.North:
                return { x: 0, y: 180 };
            case Direction.East:
                return { x: 0, y: -90 };
            case Direction.South:
                return { x: 0, y: 0 };
            case Direction.West:
                return { x: 0, y: 90 };
            case Direction.Up:
                return { x: -90, y: 0 };
            case Direction.Down:
                return { x: 90, y: 0 };
            default:
                return { x: 0, y: 0 };
        }
    }

    /**
     * Works exactly the same as the native Entity.applyDamage() method except that it prevents lowering an entity's health past its minimum.
     *
     * @param target - The entity to apply damage to.
     * @param amount - The amount of damage to do.
     * @param options - An object specifying settings such as cause and damagingEntity.
     *
     * @example
     * ```typescript
     * EntityUtil.applyDamage(myTargetMob, 20, {cause: EntityDamageCause.entityAttack});
     * ```
     */
    static applyDamage(target: Entity, amount: number, options?: EntityApplyDamageOptions | EntityApplyDamageByProjectileOptions): boolean {
        const healthComp = target.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;

        if (!healthComp) return false;

        const targetHealth = healthComp.currentValue;
        const minHealth = healthComp.effectiveMin;
        if (targetHealth === minHealth) return false;
        else if (minHealth > 0 && targetHealth - amount < minHealth) {
            target.applyDamage(targetHealth - minHealth, options);
            return true;
        } else {
            if (amount === targetHealth) amount++;
            return target.applyDamage(amount, options);
        }
    }
}
