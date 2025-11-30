import { EffectType, EffectTypes, Entity } from "@minecraft/server";

export default class EffectUtil {
    static clearEffect(entity: Entity, effect: EffectType) {
        entity.removeEffect(effect);
    }

    static clearEffects(entity: Entity) {
        const effectTypes = EffectTypes.getAll();
        for (const effectType of effectTypes) {
            entity.removeEffect(effectType);
        }
    }
}
