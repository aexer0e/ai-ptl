import { EffectType, EffectTypes, Entity } from "@minecraft/server";

export default class EffectUtil {
    /**
     * Removes a specified effect from an entity.
     *
     * @param entity - The entity from which the effect will be removed.
     * @param effect - The type of effect to be removed.
     */
    static clearEffect(entity: Entity, effect: EffectType) {
        entity.removeEffect(effect);
    }

    /**
     * Clears all effects from the given entity.
     *
     * @param entity - The entity from which to remove all effects.
     */
    static clearEffects(entity: Entity) {
        const effectTypes = EffectTypes.getAll();
        for (const effectType of effectTypes) {
            entity.removeEffect(effectType);
        }
    }
}
