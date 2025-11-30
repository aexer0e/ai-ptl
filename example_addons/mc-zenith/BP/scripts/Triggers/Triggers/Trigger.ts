import { Entity, EntityRidingComponent, Player, system } from "@minecraft/server";
import { GameEvents } from "Types/GameEvents";
import { EventCallback, EventClassName, EventName } from "Utilities/EventSubscriber";
import V2 from "Wrappers/V2";
import V3, { Volume } from "Wrappers/V3";
import TriggerManager from "../TriggerManager";

interface VolumeTrigger {
    volume: Volume;
    trigger?: "always" | "once" | "session";
    enterCallback?: (player: Player) => void;
    leaveCallback?: (player: Player) => void;
}

export default abstract class Trigger {
    static readonly Events: object;
    static readonly EntityStore = {};
    static readonly EntityStoreTemporary = {};
    static readonly WorldStore = {};

    constructor() {
        system.run(() => {
            this.init();
        });
    }

    protected onWorldEvent<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        type: ClassName,
        event: Name,
        callback: EventCallback<ClassName, Name>
    ) {
        EventSubscriber.subscribe(type, event, callback);
    }

    onVolume(volumeTrigger: VolumeTrigger) {
        let enterCallback = volumeTrigger.enterCallback;
        let leaveCallback = volumeTrigger.leaveCallback;

        if (volumeTrigger.trigger && volumeTrigger.trigger !== "always") {
            const volumeId = MathUtil.hash(V3.volumeAsString(volumeTrigger.volume));
            enterCallback = (player) => {
                if (this.hasEnteredVolume(player, volumeId, volumeTrigger.trigger == "once")) return;
                if (volumeTrigger.enterCallback) volumeTrigger.enterCallback(player);
            };

            leaveCallback = (player) => {
                if (this.hasEnteredVolume(player, volumeId, volumeTrigger.trigger == "once")) return;
                if (volumeTrigger.leaveCallback) volumeTrigger.leaveCallback(player);
                this.addEnteredVolume(player, volumeId, volumeTrigger.trigger == "once");
            };
        }

        TriggerManager.registerVolume(volumeTrigger.volume, enterCallback, leaveCallback);
    }

    private hasEnteredVolume(player: Player, volumeId: number, persistent = false) {
        const enteredVolumes = persistent ? EntityStore.get(player, "EnteredVolumes") : EntityStore.temporary.get(player, "EnteredVolumes");

        return enteredVolumes.includes(volumeId);
    }

    private addEnteredVolume(player: Player, volumeId: number, persistent = false) {
        if (persistent) EntityStore.pushToArray(player, "EnteredVolumes", volumeId);
        else EntityStore.temporary.pushToArray(player, "EnteredVolumes", volumeId);
    }

    abstract init(): void;

    protected onGameEvent<GameEvent extends keyof GameEvents>(event: GameEvent, callback: (...args: GameEvents[GameEvent]) => void) {
        GameData.events.subscribe(event, callback);
    }

    protected interval(callback: () => void, interval: number) {
        system.runInterval(callback, interval);
    }

    protected timeout(callback: () => void, timeout: number, condition?: () => boolean) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        system.runTimeout(newCallback, timeout);
    }

    protected delayedSFX(player: Player, sound: { play: (player: Player) => void }, delay: number) {
        this.timeout(
            () => {
                sound.play(player);
            },
            delay,
            this.isValidConditional(player)
        );
    }

    protected timeline(timeline: Record<number, () => void>, condition?: () => boolean) {
        Object.entries(timeline).forEach(([time, callback]) => {
            this.timeout(() => callback(), parseInt(time), condition);
        });
    }

    protected cameraShake(intensity: number, duration: number, type: "positional" | "rotational") {
        CommandUtil.runCommand(`camerashake add @a ${intensity} ${duration} ${type}`);
    }

    protected isValidConditional(entity: Entity) {
        return () => EntityUtil.isValid(entity);
    }

    protected tpWithFade(player: Player, location: V3, rotation?: V2) {
        player.addEffect("slowness", 0.7 * 20, {
            amplifier: 10,
            showParticles: false,
        });
        player.camera.fade({ fadeTime: { fadeInTime: 0.2, fadeOutTime: 0.2, holdTime: 0.5 } });
        this.timeout(() => {
            if (!EntityUtil.isValid(player)) return;

            const ridingComponent = player.getComponent("minecraft:riding") as EntityRidingComponent;

            if (ridingComponent != undefined) ridingComponent.entityRidingOn.teleport(location, { rotation });
            else player.teleport(location, { rotation });
        }, 5);
    }

    protected cameraFade(player: Player, fadeIn: number, hold: number, fadeOut: number) {
        player.camera.fade({ fadeTime: { fadeInTime: fadeIn, fadeOutTime: fadeOut, holdTime: hold } });
    }
}
