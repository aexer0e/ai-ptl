import { Entity } from "@minecraft/server";
import MobComponentManager, { MobComponentInstance, MobComponentKey } from "MobComponents/MobComponentManager";

declare module "@minecraft/server" {
    interface Entity {
        valid: () => this is Entity;
        try: () => Entity | null;
        getMobComponent<T extends MobComponentKey>(mobComponent: T): MobComponentInstance<T>;
    }
}

Entity.prototype.valid = function (this: Entity): this is Entity {
    try {
        return this.isValid;
    } catch {}
    return false;
};

Entity.prototype.try = function (this: Entity) {
    try {
        return this.isValid ? this : null;
    } catch {}
    return null;
};

Entity.prototype.getMobComponent = function <T extends MobComponentKey>(this: Entity, mobComponent: T): MobComponentInstance<T> {
    const entityComponents = MobComponentManager.mobComponents[this.id];
    if (!entityComponents) return undefined as MobComponentInstance<T>;
    return entityComponents[mobComponent] as MobComponentInstance<T>;
};
