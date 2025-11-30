import { Entity, EntityRidingComponent, Player, system } from "@minecraft/server";
import { GameEvents } from "Types/GameEvents";
import { EventCallback, EventClassName, EventName } from "Utilities/EventSubscriber";

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
        overworld.runCommand(`camerashake add @a ${intensity} ${duration} ${type}`);
    }

    protected isValidConditional(entity: Entity) {
        return () => EntityUtil.isValid(entity);
    }

    protected tpWithFade(player: Player, location: V3, rotation?: V2) {
        player.addEffect("slowness", 0.7 * 20, { amplifier: 10, showParticles: false });
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
