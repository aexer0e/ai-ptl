import { EntityDieAfterEvent, Player } from "@minecraft/server";
import MobComponentManager from "MobComponents/MobComponentManager";
import CharActivation from "MobComponents/MobComponents/CharActivation";
import EventUtil from "Utilities/EventUtil";
import SoundData from "../Game/Sound/SoundData";

export default class BadnikBounce {
    static init() {
        EventUtil.subscribe("WorldAfterEvents", "entityDie", (event) => this.enemyDeath(event));
    }

    private static enemyDeath(event: EntityDieAfterEvent) {
        const entity = event.damageSource.damagingEntity;
        const hurtEntity = event.deadEntity;

        if (hurtEntity instanceof Player) return;
        if (!entity || entity.typeId !== "minecraft:player") return;

        if (hurtEntity.typeId === "gm1_ord:eggman_rider") return;

        const Component = MobComponentManager.getInstanceOfComponent(CharActivation, entity);

        if (!Component) return;
        if (Component.currentCharacter === undefined) return;

        SoundData.enemy.death.play(entity as Player);
        entity.dimension.spawnParticle("gm1_ord:badnik_pop", hurtEntity.location);

        hurtEntity.remove();
    }
}
