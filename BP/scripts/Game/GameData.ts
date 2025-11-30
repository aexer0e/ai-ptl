import { GameEvents } from "Types/GameEvents";

class _GameData {
    static readonly NotificationPriority = {
        join: -1,
        parkour: 2,
        phud: 10,
    };

    static readonly ToLocations = {
        spawn: V3.grid(0, 0, 0),
        parkour: V3.grid(0, 0, 0),
    };

    static readonly events = new EventEmitter<GameEvents>();
}

declare global {
    // eslint-disable-next-line no-var
    var GameData: Omit<typeof _GameData, "prototype">;
}
globalThis.GameData = _GameData;
