import { Player, system } from "@minecraft/server";
import V3, { Volume } from "Wrappers/V3";
import TriggerVolumeDrawer from "./TriggerVolumeDrawer";
import Triggers from "./Triggers/index";

interface VolumeTriggerRegistered {
    volume: Volume;
    players: Set<Player>;
    enterCallback?: (player: Player) => void;
    leaveCallback?: (player: Player) => void;
}

export default class TriggerManager {
    private static readonly VolumesEnabled = false;

    private static volumeTriggers: Set<VolumeTriggerRegistered> = new Set();
    private static triggers = new Map<keyof typeof Triggers, InstanceType<(typeof Triggers)[keyof typeof Triggers]>>();

    static registerVolume(volume: Volume, enterCallback?: (player: Player) => void, leaveCallback?: (player: Player) => void) {
        this.volumeTriggers.add({
            players: new Set(),
            volume,
            enterCallback,
            leaveCallback,
        });
    }

    static init() {
        for (const TriggerKey in Triggers) {
            const Trigger = Triggers[TriggerKey] as (typeof Triggers)[keyof typeof Triggers];
            this.triggers.set(TriggerKey as keyof typeof Triggers, new Trigger());
        }

        if (this.VolumesEnabled) {
            TriggerVolumeDrawer.init();

            system.runInterval(() => {
                DebugTimer.countStart("TriggerManager.volumeTriggers");
                const players = PlayersCache.players;

                this.cleanVolumeTriggerPlayers();
                for (const { volume, players: playersInVolume, enterCallback, leaveCallback } of this.volumeTriggers) {
                    for (const player of players) {
                        if (V3.inVolume(volume, player.location, 0.5)) {
                            if (!playersInVolume.has(player.entity)) {
                                playersInVolume.add(player.entity);
                                if (enterCallback) enterCallback(player.entity);
                            }
                        } else {
                            if (playersInVolume.has(player.entity)) {
                                playersInVolume.delete(player.entity);
                                if (leaveCallback) leaveCallback(player.entity);
                            }
                        }
                    }
                }
                DebugTimer.countEnd();
            }, 1);
        }
    }

    private static cleanVolumeTriggerPlayers() {
        for (const { players } of this.volumeTriggers) {
            for (const player of players) {
                if (!EntityUtil.isValid(player)) {
                    players.delete(player);
                }
            }
        }
    }

    static getTrigger<T extends keyof typeof Triggers>(trigger: T) {
        return this.triggers.get(trigger) as InstanceType<(typeof Triggers)[T]>;
    }

    static getVolumeTriggers() {
        return this.volumeTriggers;
    }
}
