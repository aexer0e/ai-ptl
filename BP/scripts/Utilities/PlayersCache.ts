import { Dimension, Player, system, Vector3, world } from "@minecraft/server";

interface PlayerCacheData {
    id: string;
    location: V3;
    dimension: Dimension;
    bottomBlockTypeId: string | undefined;
    isSneaking: boolean;
    entity: Player;
}

class _PlayersCache {
    static readonly UpdateInterval = 3;
    static players: PlayerCacheData[] = [];

    static init() {
        this.updateCache();
        system.runInterval(() => {
            this.updateCache();
        }, this.UpdateInterval);
    }

    static updateCache() {
        DebugTimer.countStart("PlayersCache.updateCache");
        this.players = world.getPlayers().map((player) => {
            const playerLocation = new V3(player.location);
            const bottomLocation = playerLocation.setY(-64);
            const bottomBlock = player.dimension.getBlock(bottomLocation);

            return {
                id: player.id,
                dimension: player.dimension,
                location: playerLocation,
                bottomBlockTypeId: bottomBlock?.typeId,
                isSneaking: player.isSneaking,
                entity: player,
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
}

declare global {
    // eslint-disable-next-line no-var
    var PlayersCache: Omit<typeof _PlayersCache, "prototype">;
}
globalThis.PlayersCache = _PlayersCache;
