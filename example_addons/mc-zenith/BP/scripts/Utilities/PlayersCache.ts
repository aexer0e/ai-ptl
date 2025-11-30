import { Dimension, Player, system, Vector3, world } from "@minecraft/server";
import V3 from "Wrappers/V3";

/**
 * Represents cached data for a player, including location, dimension, and entity reference.
 */
interface PlayerCacheData {
    /** The unique player ID. */
    id: string;
    /** The player's current location as a V3 vector. */
    location: V3;
    /** The dimension the player is in. */
    dimension: Dimension;
    /** Whether the player is sneaking. */
    isSneaking: boolean;
    /** The player entity reference. */
    entity: Player;
}

/**
 * Utility for caching player data and providing fast queries for player proximity and location.
 * Updates the cache at a fixed interval and exposes methods for range and nearest-player queries.
 */
class _PlayersCache {
    /** How often (in ticks) the cache is updated. */
    static readonly UpdateInterval = 3;
    /** The cached player data. */
    static players: PlayerCacheData[] = [];

    /**
     * Initializes the player cache and starts periodic updates.
     */
    static init() {
        this.updateCache();
        system.runInterval(() => {
            this.updateCache();
        }, this.UpdateInterval);
    }

    /**
     * Updates the player cache with current player data from the world.
     */
    static updateCache() {
        DebugTimer.countStart("PlayersCache.updateCache");
        this.players = world.getPlayers().map((player) => {
            const playerLocation = new V3(player.location);

            return {
                id: player.id,
                dimension: player.dimension,
                location: playerLocation,
                isSneaking: player.isSneaking,
                entity: player,
            };
        });
        DebugTimer.countEnd();
    }

    /**
     * Gets all players within a given range of a location in a specific dimension.
     * @param location The center location to search from.
     * @param range The maximum distance from the location.
     * @param dimension The dimension to search in.
     * @returns An array of PlayerCacheData for players in range.
     */
    static getPlayersInRange(location: Vector3, range: number, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getPlayersInRange");
        const result = this.players.filter((player) => {
            if (dimension && dimension.id !== player.dimension.id) return false;
            return V3.distance(player.location, location) <= range;
        });
        DebugTimer.countEnd();
        return result;
    }

    /**
     * Gets the nearest player to a location in a specific dimension.
     * @param location The location to search from.
     * @param dimension The dimension to search in.
     * @returns The nearest PlayerCacheData or null if none found.
     */
    static getNearestPlayer(location: Vector3, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getNearestPlayer");
        const nearestPlayer = this.players.reduce(
            (nearest, player) => {
                if (!player.entity.valid()) return nearest;
                if (dimension && dimension.id !== player.dimension.id) return nearest;
                const distance = player.location.distanceTo(location);
                return distance < nearest.distance ? { distance, player } : nearest;
            },
            { distance: Infinity, player: null as PlayerCacheData | null }
        );

        DebugTimer.countEnd();
        return nearestPlayer.player;
    }

    /**
     * Gets the nearest player to a location within a maximum range in a specific dimension.
     * @param location The location to search from.
     * @param maxRange The maximum distance to consider.
     * @param dimension The dimension to search in.
     * @returns The nearest PlayerCacheData within range, or undefined if none found.
     */
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

    /**
     * Gets the distance to the closest player from a location in a specific dimension.
     * @param location The location to search from.
     * @param dimension The dimension to search in.
     * @returns The distance to the closest player, or Infinity if none found.
     */
    static getDistanceToClosestPlayer(location: Vector3, dimension: Dimension) {
        DebugTimer.countStart("PlayersCache.getDistanceToClosestPlayer");
        const result = this.players.reduce((min, player) => {
            if (!player.entity.valid()) return min;
            if (dimension && dimension.id !== player.dimension.id) return min;
            return Math.min(min, player.location.distanceTo(location));
        }, Infinity);
        DebugTimer.countEnd();
        return result;
    }

    /**
     * Gets the cached location of a specific player.
     * @param player The player entity to look up.
     * @returns The cached V3 location, or undefined if not found.
     */
    static getPlayerLocation(player: Player) {
        DebugTimer.countStart("PlayersCache.getPlayerLocation");
        const result = this.players.find((p) => p.id === player.id)?.location;
        DebugTimer.countEnd();
        return result;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var PlayersCache: Omit<typeof _PlayersCache, "prototype">;
}
globalThis.PlayersCache = _PlayersCache;
