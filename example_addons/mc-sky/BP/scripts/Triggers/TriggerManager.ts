import { Player, system, world } from "@minecraft/server";
import { Volume } from "Types/Volume";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import TriggerVolumeDrawer from "./TriggerVolumeDrawer";
import Triggers from "./Triggers/index";

interface VolumeTriggerRegistered {
    volume: Volume;
    players: Set<Player>;
    enterCallback?: (player: Player) => void;
    leaveCallback?: (player: Player) => void;
}

export default class TriggerManager {
    private static volumeTriggers: Set<VolumeTriggerRegistered> = new Set();
    private static scriptEventPhonecalls: Map<string, (player: Player) => void> = new Map();

    static registerVolume(volume: Volume, enterCallback?: (player: Player) => void, leaveCallback?: (player: Player) => void) {
        this.volumeTriggers.add({
            players: new Set(),
            volume,
            enterCallback,
            leaveCallback,
        });
    }

    static registerScriptEventPhonecall(id: string, callback: (player: Player) => void) {
        this.scriptEventPhonecalls.set(id, callback);
    }

    static init() {
        for (const Trigger of Triggers) {
            new Trigger();
        }

        TriggerVolumeDrawer.init();

        system.runInterval(() => {
            const players = world.getPlayers();

            this.cleanVolumeTriggerPlayers();
            for (const { volume, players: playersInVolume, enterCallback, leaveCallback } of this.volumeTriggers) {
                for (const player of players) {
                    if (V3.inVolume(volume, player.location, 0.5)) {
                        if (!playersInVolume.has(player)) {
                            playersInVolume.add(player);
                            if (enterCallback) enterCallback(player);
                        }
                    } else {
                        if (playersInVolume.has(player)) {
                            playersInVolume.delete(player);
                            if (leaveCallback) leaveCallback(player);
                        }
                    }
                }
            }
        }, 1);
    }

    static cleanVolumeTriggerPlayers() {
        for (const { players } of this.volumeTriggers) {
            for (const player of players) {
                if (!EntityUtil.isValid(player)) {
                    players.delete(player);
                }
            }
        }
    }

    static getVolumeTriggers() {
        return this.volumeTriggers;
    }
}
