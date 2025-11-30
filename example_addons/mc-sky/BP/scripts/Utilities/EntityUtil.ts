import {
    Dimension,
    Direction,
    Entity,
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
import V3 from "Wrappers/V3";
import DebugTimer from "./DebugTimer";

export default class EntityUtil {
    static getEntities(query: EntityQueryOptions, dimension: Dimension): Entity[] {
        DebugTimer.countStart("EntityUtil.getEntities");
        const result = dimension.getEntities(query);
        DebugTimer.countEnd();
        return result;
    }

    static getEntitiesGlobal(query: EntityQueryOptions): Entity[] {
        DebugTimer.countStart("EntityUtil.getEntitiesGlobal");
        const result = [
            ...world.getDimension("overworld").getEntities(query),
            ...world.getDimension("nether").getEntities(query),
            ...world.getDimension("the_end").getEntities(query),
        ];
        DebugTimer.countEnd();
        return result;
    }

    static getPlayers(dimension: Dimension): Player[] {
        DebugTimer.countStart("EntityUtil.getPlayers");
        const result = this.getEntities({ type: "player" }, dimension) as Player[];
        DebugTimer.countEnd();
        return result;
    }

    static getNearestPlayer(location: Vector3, dimension: Dimension, distanceBetween?: [number, number]): Player | undefined {
        DebugTimer.countStart("EntityUtil.getNearestPlayer");
        const players = this.getEntities(
            {
                type: "player",
                closest: 1,
                minDistance: distanceBetween && distanceBetween[0],
                maxDistance: distanceBetween && distanceBetween[1],
                location,
            },
            dimension
        );

        DebugTimer.countEnd();
        if (players.length === 0) return undefined;
        return players[0] as Player;
    }

    static getNearbyPlayers(location: Vector3, radius: number, dimension: Dimension): Player[] {
        DebugTimer.countStart("EntityUtil.getNearbyPlayers");
        const result = this.getEntities({ type: "player", location, maxDistance: radius }, dimension) as Player[];
        DebugTimer.countEnd();
        return result;
    }

    static killEntities(query: EntityQueryOptions, dimension: Dimension): void {
        DebugTimer.countStart("EntityUtil.killEntities");
        const entities = this.getEntities(query, dimension);
        for (const entity of entities) {
            entity.kill();
        }
        DebugTimer.countEnd();
    }

    static removeEntities(query: EntityQueryOptions, dimension: Dimension): void {
        DebugTimer.countStart("EntityUtil.removeEntities");
        const entities = this.getEntities(query, dimension);
        for (const entity of entities) {
            entity.remove();
        }
        DebugTimer.countEnd();
    }

    static visibleNearbyMob(entity: Entity, query: EntityQueryOptions, maxDistance: number = 6) {
        DebugTimer.countStart("EntityUtil.visibleNearbyMob");
        const monstersNearby = EntityUtil.getEntities(
            {
                location: entity.location,
                maxDistance,
                ...query,
            },
            entity.dimension
        );

        for (const monster of monstersNearby) {
            const direction = V3.subtract(monster.location, entity.getHeadLocation()).normalize();
            const raycast = entity.dimension.getEntitiesFromRay(entity.getHeadLocation(), direction, {})[1];
            if (raycast?.entity.id === monster.id) {
                return monster;
            }
        }
        DebugTimer.countEnd();
    }

    static isEntityVisible(location: Vector3, target: Entity, maxDistance: number): boolean {
        DebugTimer.countStart("EntityUtil.isEntityVisible");
        const direction = V3.subtract(new V3(target.location).addY(1.7), location).normalize();
        const raycast = world
            .getDimension("overworld")
            .getEntitiesFromRay(location, direction, { maxDistance, includePassableBlocks: false })
            .find((e) => e.entity.id === target.id);
        DebugTimer.countEnd();
        return raycast?.entity.id === target.id;
    }

    static canSeeEntity(entity: Entity, target: Entity, maxDistance: number): boolean {
        DebugTimer.countStart("EntityUtil.canSeeEntity");
        const result = !!entity.getEntitiesFromViewDirection({ type: target.typeId, maxDistance }).find((e) => e.entity.id === target.id);
        DebugTimer.countEnd();
        return result;
    }

    static spawnItem(itemStack: ItemStack, location: Vector3, dimension: Dimension) {
        // return dimension.spawnItem(itemStack, location);
        DebugTimer.countStart("EntityUtil.spawnItem");
        const result = dimension.spawnItem(itemStack, location);
        DebugTimer.countEnd();
        return result;
    }

    static spawnEntity(type: string, location: Vector3, dimension: Dimension): Entity {
        // return dimension.spawnEntity(type, location);
        DebugTimer.countStart("EntityUtil.spawnEntity");
        const result = dimension.spawnEntity(type, location);
        DebugTimer.countEnd();
        return result;
    }

    static trySpawnEntity(type: string, location: Vector3, dimension: Dimension) {
        DebugTimer.countStart("EntityUtil.trySpawnEntity");
        let result: Entity | null = null;
        try {
            result = dimension.spawnEntity(type, location);
        } catch (e) {
            result = null;
        }
        DebugTimer.countEnd();
        return result;
    }

    static spawnEntityRotated(type: string, location: Vector3, rotation: Vector2, dimension: Dimension): Entity {
        DebugTimer.countStart("EntityUtil.spawnEntityRotated");
        const entity = dimension.spawnEntity(type, location);
        entity.teleport(location, { rotation });
        DebugTimer.countEnd();
        return entity;
    }

    static spawnEntityWithDirection(type: string, location: Vector3, direction: Direction, dimension: Dimension): Entity {
        DebugTimer.countStart("EntityUtil.spawnEntityWithDirection");
        const entity: Entity = dimension.spawnEntity(type, location);
        const rotation = EntityUtil.convertDirectionToRotation(direction);
        entity.setRotation(rotation);
        DebugTimer.countEnd();
        return entity;
    }

    static spawnEntities(type: string, location: Vector3, amount: number, dimension: Dimension): Entity[] {
        DebugTimer.countStart("EntityUtil.spawnEntities");
        const entities: Entity[] = [];
        for (let i = 0; i < amount; i++) {
            entities.push(this.spawnEntity(type, location, dimension));
        }
        DebugTimer.countEnd();
        return entities;
    }

    static isValid(entity: Maybe<Entity>): entity is Entity {
        DebugTimer.countStart("EntityUtil.isValid");
        let result = false;
        try {
            // @ts-expect-error
            result = entity.isValid();
        } catch (e) {
            result = false;
        }

        DebugTimer.countEnd();
        return result;
    }

    static isAlive(entity: Entity | null): boolean {
        DebugTimer.countStart("EntityUtil.isAlive");
        let result = false;
        try {
            if (!this.isValid(entity)) return false;
            const healthComponent = entity.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
            if (!healthComponent) return true;
            entity = entity as Entity;
            result = healthComponent.currentValue > 0;
        } catch (e) {
            result = false;
        }
        DebugTimer.countEnd();
        return result;
    }

    static hasFamilies(entity: Entity, families: string[], dimension: Dimension): boolean {
        return this.getEntities({ type: entity.typeId, families }, dimension).length > 0;
    }

    static getPlayerById(id: string): Player | undefined {
        return world.getAllPlayers().find((player) => player.id === id);
    }

    static getEntityById(id: string): Entity | undefined {
        return world.getEntity(id);
    }

    static setSpawnPoint(player: Player, location: Vector3, dimension: Dimension) {
        player.setSpawnPoint({
            dimension: dimension,
            x: location.x,
            y: location.y,
            z: location.z,
        });
    }

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
}
