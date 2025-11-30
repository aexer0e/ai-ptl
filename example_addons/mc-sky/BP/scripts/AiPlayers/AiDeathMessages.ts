import { Entity, EntityDamageCause, EntityDieAfterEvent, RawMessage } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EntityUtil from "Utilities/EntityUtil";

export default class AiDeathMessages {
    static readonly SimpleDeathsMessageMap = {
        entityExplosion: "explosion",
        blockExplosion: "explosion",
        drowning: "drown",
        fall: "fall",
        fallingBlock: "fallingBlock",
        anvil: "anvil",
        void: "outOfWorld",
        none: "generic",
        selfDestruct: "generic",
        piston: "inWall",
        lava: "lava",
        freezing: "freeze",
        lightning: "lightningBolt",
        magic: "magic",
        magma: "magma",
        suffocation: "inWall",
        fire: "onFire",
        fireTick: "onFire",
        campfire: "onFire",
        soulCampfire: "onFire",
        wither: "wither",
        sonicBoom: "sonicBoom",
    };

    static readonly ProjectileDamagerLocMap = {
        "minecraft:thrown_trident": "item.trident.name",
        "minecraft:arrow": "item.arrow.name",
    };

    static DamagingProjectileLocKeyMap = {
        "minecraft:thrown_trident": "trident",
        "minecraft:fireball": "fireball",
        "minecraft:llama_spit": "spit",
        "minecraft:arrow": "arrow",
    };

    static broadcastDeathMessage(eventData: EntityDieAfterEvent) {
        if (eventData.deadEntity.typeId != "gm1_sky:ai_player") return;

        const damageCause = eventData.damageSource.cause;
        const damager = eventData.damageSource.damagingEntity;
        const damagerTypeId = damager?.typeId;
        const damagerMobName = this.getName(damager);
        const deadMobName = EntityStore.get(eventData.deadEntity, "name");

        const simpleDeathMessage = this.SimpleDeathsMessageMap[damageCause];
        if (simpleDeathMessage) return this.deathMessage(simpleDeathMessage, deadMobName);

        if (this.isDamageCauseAnyOf(damageCause, "entityAttack", "ramAttack", "thorns")) {
            if (damagerMobName) this.deathMessage("mob", deadMobName, damagerMobName);
            else this.genericDeathMessage(eventData);
            return;
        }

        if (damageCause == "projectile") {
            const projectileDamagerLoc = this.ProjectileDamagerLocMap[damagerTypeId!];
            if (projectileDamagerLoc) return this.deathMessage("mob", deadMobName, { translate: projectileDamagerLoc });

            const damagingProjectileTypeId = eventData.damageSource.damagingProjectile?.typeId;
            const damagingProjectileLocKey = this.DamagingProjectileLocKeyMap[damagingProjectileTypeId!];
            if (damagingProjectileLocKey) return this.deathMessage(damagingProjectileLocKey, deadMobName, damagerMobName || "Unknown");
        }

        return this.genericDeathMessage(eventData);
    }

    static deathMessage(key: string, ...translations: (string | RawMessage)[]) {
        BroadcastUtil.translate("death.attack." + key, translations);
    }

    static isDamageCauseAnyOf(damageCause: EntityDamageCause, ...causes: `${EntityDamageCause}`[]) {
        return causes.includes(damageCause);
    }

    static getName(entity?: Entity) {
        if (!EntityUtil.isValid(entity)) return null;
        else if (entity.nameTag.length) return { text: entity.nameTag };
        else if (entity.typeId.startsWith("minecraft:")) return { translate: `entity.${entity.typeId.split(":")[1]}.name` };
        else return { translate: `entity.${entity.typeId}.name` };
    }

    static genericDeathMessage(eventData: EntityDieAfterEvent) {
        BroadcastUtil.translate("death.attack.generic", [eventData.deadEntity.nameTag]);
    }
}
