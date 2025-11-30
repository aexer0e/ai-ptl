import { Entity, EntityRidingComponent, Player, system, world } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import { GameEvents } from "Types/GameEvents";
import { Subscription, SubscriptionsMap } from "Types/Subscription";
import { Volume } from "Types/Volume";
import CommandUtil from "Utilities/CommandUtil";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import Runner from "Utilities/Runner";
import V2 from "Wrappers/V2";
import V3 from "Wrappers/V3";
import TriggerManager from "../TriggerManager";

interface VolumeTrigger {
    volume: Volume;
    trigger?: "always" | "once" | "session";
    enterCallback?: (player: Player) => void;
    leaveCallback?: (player: Player) => void;
}

export default abstract class Trigger {
    constructor() {
        system.run(() => {
            this.init();
        });
    }

    protected onWorldEvent<
        Type extends keyof SubscriptionsMap,
        Event extends Parameters<SubscriptionsMap[Type]>[0],
        Callback extends Parameters<Subscription<Type, Event>>[1],
        Options extends Parameters<Subscription<Type, Event>>[2],
    >(type: Type, event: Event, callback: Callback, options?: Options) {
        switch (type) {
            case "WorldBefore":
                world.beforeEvents[event as keyof typeof world.beforeEvents].subscribe(callback as never);
                break;

            case "WorldAfter":
                // @ts-ignore
                if (options) world.afterEvents[event as keyof typeof world.afterEvents].subscribe(callback as never, options);
                else world.afterEvents[event as keyof typeof world.afterEvents].subscribe(callback as never);
                break;
        }
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
        const enteredVolumesString = persistent
            ? EntityStore.get(player, "enteredVolumes")
            : EntityStore.temporary.get(player, "enteredVolumes");

        const enteredVolumes = JSON.parse(enteredVolumesString);
        return enteredVolumes.includes(volumeId);
    }

    private addEnteredVolume(player: Player, volumeId: number, persistent = false) {
        const enteredVolumesString = persistent
            ? EntityStore.get(player, "enteredVolumes")
            : EntityStore.temporary.get(player, "enteredVolumes");

        const enteredVolumes = JSON.parse(enteredVolumesString);
        enteredVolumes.push(volumeId);

        if (persistent) EntityStore.set(player, "enteredVolumes", JSON.stringify(enteredVolumes));
        else EntityStore.temporary.set(player, "enteredVolumes", JSON.stringify(enteredVolumes));
    }

    abstract init(): void;

    protected onGameEvent<GameEvent extends keyof GameEvents>(event: GameEvent, callback: (...args: GameEvents[GameEvent]) => void) {
        GameData.events.subscribe(event, callback);
    }

    protected interval(callback: () => void, interval: number) {
        Runner.interval(callback, interval);
    }

    protected timeout(callback: () => void, timeout: number, condition?: () => boolean) {
        const newCallback = condition ? () => (condition() ? callback() : null) : callback;
        Runner.timeout(newCallback, timeout);
    }

    protected delayedSFX(player: Player, sound: /*PlayerSound*/ { play }, delay: number) {
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
