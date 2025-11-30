import {
    Dimension,
    Direction,
    Entity,
    EntityHealthComponent,
    EntityQueryOptions,
    EntityTypeFamilyComponent,
    ItemStack,
    Player,
    Vector2,
    Vector3,
    world,
} from "@minecraft/server";
import { EntityReference } from "MobComponents/MobComponents/MobComponent";

type DimLoc = { location: Vector3; dimension: Dimension };

class _EntityUtil {
    static getEntities(query: EntityQueryOptions, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.getEntities");

        const result = dimension.getEntities(query);
        DebugTimer.countEnd();
        return result;
    }

    static getPlayers() {
        DebugTimer.countStart("EntityUtil.getPlayers");
        const result = PlayersCache.players.map((p) => p.entity);
        DebugTimer.countEnd();
        return result;
    }

    static getNearestPlayer(location: Vector3, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.getNearestPlayer");
        const result = PlayersCache.getNearestPlayer(location, dimension)?.entity;
        DebugTimer.countEnd();
        return result;
    }

    static getNearestPlayerAtDimLoc(dimLoc: DimLoc) {
        DebugTimer.countStart("EntityUtil.getNearestPlayerToEntity");
        const result = PlayersCache.getNearestPlayer(dimLoc.location, dimLoc.dimension)?.entity;
        DebugTimer.countEnd();
        return result;
    }

    static getNearbyPlayers(radius: number, location: Vector3, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.getNearbyPlayers");
        const result = PlayersCache.getPlayersInRange(location, radius, dimension).map((e) => e.entity);
        DebugTimer.countEnd();
        return result;
    }

    static getNearbyPlayersAtDimLoc(radius: number, dimLoc: DimLoc) {
        DebugTimer.countStart("EntityUtil.getNearbyPlayersToEntity");
        const result = PlayersCache.getPlayersInRange(dimLoc.location, radius, dimLoc.dimension).map((e) => e.entity);
        DebugTimer.countEnd();
        return result;
    }

    static killEntities(query: EntityQueryOptions, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.killEntities");
        const entities = this.getEntities(query, dimension);
        for (const entity of entities) {
            entity.kill();
        }
        DebugTimer.countEnd();
    }

    static removeEntities(query: EntityQueryOptions, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.removeEntities");
        const entities = this.getEntities(query, dimension);
        for (const entity of entities) {
            entity.remove();
        }
        DebugTimer.countEnd();
    }

    static spawnItem(itemStack: ItemStack, location: Vector3, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.spawnItem");
        const result = dimension.spawnItem(itemStack, location);
        DebugTimer.countEnd();
        return result;
    }

    static spawnItemAtDimLoc(itemStack: ItemStack, dimLoc: DimLoc) {
        DebugTimer.countStart("EntityUtil.spawnItemAtDimLoc");
        const result = dimLoc.dimension.spawnItem(itemStack, dimLoc.location);
        DebugTimer.countEnd();
        return result;
    }

    static spawnEntity(type: string, location: Vector3, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.spawnEntity");
        //Error caused by type is a vanilla issue
        const result = dimension.spawnEntity(type, location);
        DebugTimer.countEnd();
        return result;
    }

    static spawnEntityAtDimLoc(type: string, dimLoc: DimLoc) {
        DebugTimer.countStart("EntityUtil.spawnEntityAtDimLoc");
        //Error caused by type is a vanilla issue
        const result = dimLoc.dimension.spawnEntity(type, dimLoc.location);
        DebugTimer.countEnd();
        return result;
    }

    static spawnEntityRotated(type: string, location: Vector3, rotation: Vector2, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.spawnEntityRotated");
        //Error caused by type is a vanilla issue
        const entity = dimension.spawnEntity(type, location);
        entity.setRotation(rotation);
        return entity;
    }

    static spawnEntityWithDirection(type: string, location: Vector3, direction: Direction, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.spawnEntityWithDirection");
        //Error caused by type is a vanilla issue
        const entity: Entity = dimension.spawnEntity(type, location);
        const rotation = _EntityUtil.convertDirectionToRotation(direction);
        entity.setRotation(rotation);
        DebugTimer.countEnd();
        return entity;
    }

    static spawnEntities(type: string, amount: number, location: Vector3, dimension: Dimension = overworld) {
        DebugTimer.countStart("EntityUtil.spawnEntities");
        const entities: Entity[] = [];
        for (let i = 0; i < amount; i++) {
            entities.push(this.spawnEntity(type, location, dimension));
        }
        DebugTimer.countEnd();
        return entities;
    }

    static isValid(entity: EntityReference): entity is Entity {
        DebugTimer.countStart("EntityUtil.isValid");
        let result = false;
        try {
            result = (entity as Entity).isValid;
        } catch {}

        DebugTimer.countEnd();
        return result;
    }

    static isAlive(entity: Entity) {
        DebugTimer.countStart("EntityUtil.isAlive");
        const returnAndEndCount = (result: boolean) => {
            DebugTimer.countEnd();
            return result;
        };
        if (!this.isValid(entity)) return returnAndEndCount(false);
        const healthComponent = entity.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
        if (!healthComponent) return returnAndEndCount(false);
        entity = entity as Entity;
        return returnAndEndCount(healthComponent.currentValue > healthComponent.effectiveMin);
    }

    static hasFamilies(entity: Entity, families: string[]) {
        DebugTimer.countStart("EntityUtil.hasFamilies");
        const familyComponent = entity.getComponent(EntityTypeFamilyComponent.componentId) as EntityTypeFamilyComponent;
        const result = familyComponent && families.every((family) => familyComponent.hasTypeFamily(family));
        DebugTimer.countEnd();
        return result;
    }

    static getPlayerByName(name: string) {
        DebugTimer.countStart("EntityUtil.getPlayerByName");
        const result = world.getAllPlayers().find((player) => player.name === name);
        DebugTimer.countEnd();
        return result;
    }

    static getEntityById(id: string) {
        DebugTimer.countStart("EntityUtil.getEntityById");
        const result = world.getEntity(id);
        DebugTimer.countEnd();
        return result;
    }

    static setSpawnPoint(player: Player, location: Vector3, dimension: Dimension = overworld) {
        player.setSpawnPoint({ dimension, x: location.x, y: location.y, z: location.z });
    }

    static convertDirectionToRotation(direction: Direction) {
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

declare global {
    // eslint-disable-next-line no-var
    var EntityUtil: Omit<typeof _EntityUtil, "prototype">;
}
globalThis.EntityUtil = _EntityUtil;
