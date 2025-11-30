import { Dimension, EntityTypeFamilyComponent, Player, system, Vector3, world } from "@minecraft/server";
import GameData from "Game/GameData";
import V3 from "Wrappers/V3";
import DebugTimer from "../Utilities/DebugTimer";

export interface PlayerCacheData {
    id: string;
    location: V3;
    dimension: Dimension;
    bottomBlockTypeId: string | undefined;
    isSneaking: boolean;
    entity: Player;
    minedOreTimestamp: number;
    choppedTreeTimestamp: number;
    attackedHostileMobTimestamp: number;
    attackedPassiveMobTimestamp: number;
}

export default class PlayersCache {
    static readonly UpdateInterval = 3;
    static players: PlayerCacheData[] = [];

    static init() {
        this.updateCache();
        system.runInterval(() => {
            this.updateCache();
        }, this.UpdateInterval);

        world.afterEvents.playerBreakBlock.subscribe((eventData) => {
            const player = this.players.find((p) => p.id === eventData.player.id);
            if (!player) return;

            if (GameData.ItemGroup["minecraft:ore"].includes(eventData.brokenBlockPermutation.type.id)) {
                player.minedOreTimestamp = system.currentTick;
            } else if (GameData.ItemGroup["minecraft:log"].includes(eventData.brokenBlockPermutation.type.id)) {
                player.choppedTreeTimestamp = system.currentTick;
            }
        });

        world.afterEvents.entityHitEntity.subscribe((eventData) => {
            const player = this.players.find((p) => p.id === eventData.damagingEntity.id);
            if (!player) return;

            const target = eventData.hitEntity;
            const targetFamilyComponent = target.getComponent(EntityTypeFamilyComponent.componentId) as EntityTypeFamilyComponent;
            const targetFamilies = targetFamilyComponent.getTypeFamilies();
            const isHostile = targetFamilies && GameData.HostileTargetFamilies.some((family) => targetFamilies.includes(family));
            if (isHostile) {
                player.attackedHostileMobTimestamp = system.currentTick;
            } else {
                const isPassive = targetFamilies && GameData.PassiveTargetFamilies.some((family) => targetFamilies.includes(family));
                if (isPassive) player.attackedPassiveMobTimestamp = system.currentTick;
            }
        });
    }

    static updateCache() {
        DebugTimer.countStart("PlayersCache.updateCache");
        this.players = world.getPlayers().map((player) => {
            const playerLocation = new V3(player.location);
            const bottomLocation = playerLocation.setY(-64);
            const bottomBlock = player.dimension.getBlock(bottomLocation);

            const oldCache = this.players.find((p) => p.id === player.id);

            return {
                id: player.id,
                dimension: player.dimension,
                location: playerLocation,
                bottomBlockTypeId: bottomBlock?.typeId,
                isSneaking: player.isSneaking,
                entity: player,
                minedOreTimestamp: oldCache?.minedOreTimestamp || 0,
                choppedTreeTimestamp: oldCache?.choppedTreeTimestamp || 0,
                attackedHostileMobTimestamp: oldCache?.attackedHostileMobTimestamp || 0,
                attackedPassiveMobTimestamp: oldCache?.attackedPassiveMobTimestamp || 0,
            };
        });
        DebugTimer.countEnd();
    }

    static getPlayersInRange(location: Vector3, range: number, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getPlayersInRange");
        const result = this.players.filter((player) => {
            if (dimension && dimension.id !== player.dimension.id) return false;
            return V3.distance(player.location, location) <= range;
        });
        DebugTimer.countEnd();
        return result;
    }

    static getNearestPlayer(location: Vector3, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getNearestPlayer");
        const nearestPlayer = this.players.reduce(
            (nearest, player) => {
                if (dimension && dimension.id !== player.dimension.id) return nearest;
                const distance = player.location.distanceTo(location);
                return distance < nearest.distance ? { distance, player } : nearest;
            },
            { distance: Infinity, player: null as PlayerCacheData | null }
        );

        DebugTimer.countEnd();
        return nearestPlayer.player;
    }

    static getNearestPlayerMaxRange(location: Vector3, maxRange: number, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getNearestPlayerMaxRange");
        const nearestPlayer = this.getNearestPlayer(location, dimension);
        if (!nearestPlayer) {
            DebugTimer.countEnd();
            return undefined;
        }

        const distance = nearestPlayer.location.distanceTo(location);
        DebugTimer.countEnd();
        return distance <= maxRange ? nearestPlayer : undefined;
    }

    static getDistanceToClosestPlayer(location: Vector3, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getDistanceToClosestPlayer");
        const result = this.players.reduce((min, player) => {
            if (dimension && dimension.id !== player.dimension.id) return min;
            return Math.min(min, player.location.distanceTo(location));
        }, Infinity);
        DebugTimer.countEnd();
        return result;
    }

    static getPlayerLocation(player: Player) {
        DebugTimer.countStart("PlayersCache.getPlayerLocation");
        const result = this.players.find((p) => p.id === player.id)?.location;
        DebugTimer.countEnd();
        return result;
    }

    static getPlayerBottomBlockTypeId(player: Player) {
        DebugTimer.countStart("PlayersCache.getPlayerBottomBlockTypeId");
        const result = this.players.find((p) => p.id === player.id)?.bottomBlockTypeId;
        DebugTimer.countEnd();
        return result;
    }

    static getPlayerCache(player: Player) {
        DebugTimer.countStart("PlayersCache.getPlayerCache");
        const result = this.players.find((p) => p.id === player.id);
        DebugTimer.countEnd();
        return result;
    }
}
