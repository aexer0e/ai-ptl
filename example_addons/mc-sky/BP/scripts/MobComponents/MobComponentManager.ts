import { Entity, world } from "@minecraft/server";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EntityUtil from "Utilities/EntityUtil";
import Runner from "Utilities/Runner";
import MobComponent from "./MobComponents/MobComponent";
import MobComponents from "./MobComponents/index";
import TemporaryEntities from "./TemporaryEntities";

export default class MobComponentManager {
    private static componentsToRegister: { entityTypes: string[]; component: (typeof MobComponents)[number] }[] = [];
    private static mobComponents: { [key: string]: MobComponent[] } = {};
    static entityIdsRegistered: Set<string> = new Set();

    static init() {
        for (const MobComponent of MobComponents) {
            this.componentsToRegister.push({ entityTypes: MobComponent.EntityTypes, component: MobComponent });
        }

        world.afterEvents.playerSpawn.subscribe(({ player }) => this.register(player));
        world.afterEvents.entitySpawn.subscribe(({ entity }) => this.register(entity));
        world.afterEvents.entityLoad.subscribe(({ entity }) => this.registerPreExisting(entity));
        [
            ...world.getDimension("overworld").getEntities(),
            ...world.getDimension("nether").getEntities(),
            ...world.getDimension("the_end").getEntities(),
        ].forEach((entity) => this.registerPreExisting(entity));

        Runner.interval(() => this.cleanup(), 40);
    }

    static registerPreExisting(entity: Entity) {
        const entityId = entity.typeId;
        if (TemporaryEntities.includes(entityId)) {
            try {
                entity.remove();
            } catch (e) {}
            return;
        }
        this.register(entity, true);
    }

    static register(entity: Entity, preExisting = false) {
        if (!EntityUtil.isValid(entity)) return;
        if (this.entityIdsRegistered.has(entity.id)) return;
        this.entityIdsRegistered.add(entity.id);

        this.mobComponents[entity.id] = [];
        for (const { entityTypes, component } of this.componentsToRegister) {
            if (entityTypes.includes(entity.typeId)) {
                if (!EntityUtil.isValid(entity)) continue;
                this.mobComponents[entity.id].push(new component(entity, undefined, preExisting));
            }
        }
    }

    static cleanup() {
        for (const entityId in this.mobComponents) {
            const entity = world.getEntity(entityId);
            if (!EntityUtil.isValid(entity)) {
                for (const component of this.mobComponents[entityId]) {
                    component.destroy();
                }
                delete this.mobComponents[entityId];
                this.entityIdsRegistered.delete(entityId);
            }
        }
    }

    static countRegisteredComponents() {
        const count = {};
        for (const entityId in this.mobComponents) {
            for (const component of this.mobComponents[entityId]) {
                if (count[component.constructor.name]) count[component.constructor.name]++;
                else count[component.constructor.name] = 1;
            }
        }
        BroadcastUtil.debug(JSON.stringify(count));
    }
}
