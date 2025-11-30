import { Entity, EntityDamageCause, EntityIsTamedComponent, EntityQueryOptions } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Eggman from "../Eggman";
import PMPart from "./PMPart";

export default class PMPunch extends PMPart {
    inPunchMode = false;
    private punchTier = 0;
    private punchMiner: Entity | null = null;

    ProcessPunch() {
        // Type safety appeasement
        if (!this.charComp.currentCharacter) return;

        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter];
        const blockBreakForwardOffset = charVals.blockBreakForwardOffset;
        const tiers = charVals.abilityTiers;

        if (this.moveComp.landedSinceSneakAbility && this.moveComp.isSneaking) {
            this.player.addEffect("slow_falling", 5, { amplifier: GameData.SneakSlowFall, showParticles: false });
            this.player.addEffect("slowness", 5, { amplifier: GameData.SneakSlowness, showParticles: false });
            this.moveComp.numberOfTicksSneakHasBeenHeld += 1;
            if (this.moveComp.numberOfTicksSneakHasBeenHeld === 1) {
                this.moveComp.SetChestplateDurability(1);
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld === tiers[1].sneakTicks) {
                this.moveComp.SetChestplateDurability(2);
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld === tiers[2].sneakTicks) {
                this.moveComp.SetChestplateDurability(3);
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld === tiers[3].sneakTicks) {
                this.moveComp.SetChestplateDurability(4);
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld === tiers[4].sneakTicks) {
                this.moveComp.SetChestplateDurability(5);
            }
        }

        if (this.moveComp.isSneaking === false && this.moveComp.numberOfTicksSneakHasBeenHeld > 0) {
            if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[0].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[1].sneakTicks
            ) {
                this.punchTier = 0;
                this.ExecutePunch(charVals);
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[1].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[2].sneakTicks
            ) {
                this.punchTier = 1;
                this.ExecutePunch(charVals);
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[2].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[3].sneakTicks
            ) {
                this.punchTier = 2;
                this.ExecutePunch(charVals);
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[3].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[4].sneakTicks
            ) {
                this.punchTier = 3;
                this.ExecutePunch(charVals);
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[4].sneakTicks) {
                this.punchTier = 4;
                this.ExecutePunch(charVals);
            }
            this.moveComp.numberOfTicksSneakHasBeenHeld = 0;
            if (charVals.abilityTiers[this.punchTier].breaksBlocks && EntityStore.get(this.player, "canAbilityBreak")) {
                const charName = this.charComp.currentCharacter.replace("gm1_ord:", "").replace("_life", "");
                const minerId = `gm1_ord:miner_${charName}`;
                this.punchMiner = this.moveComp.dimension.spawnEntity(minerId, this.moveComp.playerLoc);
                this.punchMiner.triggerEvent(`gm1_ord:tier_${this.punchTier}`);
            }
        }

        this.moveComp.ticksSinceAbilityExecution += 1;
        if (
            this.inPunchMode &&
            (this.moveComp.isSneaking || this.player.isSprinting || this.moveComp.momentum < charVals.exitPunchMomentum)
        ) {
            this.moveComp.SetChestplateDurability(0);
            this.EndPunchMode(charVals);
        } else if (this.inPunchMode) {
            // Block breaking
            let forwardDirection = new V3(this.player.getViewDirection());
            forwardDirection = forwardDirection.normalize();
            this.moveComp.playerLoc = new V3(this.player.location);
            if (this.punchMiner && EntityUtil.isValid(this.punchMiner)) {
                const playerPos = this.moveComp.playerLoc;
                let minerPos = forwardDirection.multiply(blockBreakForwardOffset);
                minerPos = forwardDirection.addV3(playerPos);
                this.punchMiner.teleport(minerPos);
            }
            // Entity hitting
            const abilityTier = charVals.abilityTiers[this.punchTier];
            let hitMonster = false;
            const queryLoc = V3.add(this.moveComp.playerLoc, forwardDirection.multiply(abilityTier.punchEntityForwardOffset));
            queryLoc.y += 1.0;
            const query: EntityQueryOptions = {
                location: queryLoc,
                maxDistance: abilityTier.punchEntityDetectionRadius,
            };
            const foundEntities = EntityUtil.getEntities(query, this.moveComp.dimension);
            for (const entity of foundEntities) {
                if (entity !== this.player && this.moveComp.EntityIsGeneralTargetable(entity)) {
                    hitMonster = true;
                    break;
                }
            }
            if (hitMonster) {
                this.moveComp.dimension
                    .getEntities({
                        location: queryLoc,
                        maxDistance: abilityTier.damageRadius,
                    })
                    .forEach((target) => {
                        const tameableComponent = target.getComponent(EntityIsTamedComponent.componentId) as EntityIsTamedComponent;
                        if (tameableComponent) {
                            return;
                        }
                        if (target !== this.player && this.moveComp.EntityIsGeneralTargetable(target)) {
                            const targetLoc = target.location;
                            EntityUtil.applyDamage(target, abilityTier.damage, {
                                damagingEntity: this.player,
                                cause: EntityDamageCause.entityAttack,
                            });
                            if (this.punchTier === 4 && target.typeId === "gm1_ord:eggman")
                                MobComponentManager.getInstanceOfComponent(Eggman, target).signalCriticalHit();
                            const relativeDir = new V3(
                                targetLoc.x - this.moveComp.playerLoc.x,
                                0,
                                targetLoc.z - this.moveComp.playerLoc.z
                            ).normalize();
                            target.applyKnockback(relativeDir.x, relativeDir.z, abilityTier.targetHKnockback, abilityTier.targetVKnockback);
                        }
                    });
                this.moveComp.momentum = GameData.MinMomentum;
                this.EndPunchMode(charVals);
                this.moveComp.timeout(() => this.moveComp.ArrestVelocity(), 1);
                this.moveComp.DelayedChestplateDurability(7, 0, charVals.impactNotificationTicks);
                this.moveComp.EndInvulnerability();
            }
        }
    }

    ExecutePunch(charVals) {
        this.moveComp.ticksSinceAbilityExecution = 0;
        this.inPunchMode = true;
        this.moveComp.invulnerable = true;
        this.moveComp.landedSinceSneakAbility = false;
        this.moveComp.ticksSinceAbilityAir = 0;

        if (charVals.abilityTiers[this.punchTier].breaksBlocks) this.moveComp.SetChestplateDurability(8);
        else this.moveComp.SetChestplateDurability(6);

        let impulseDirection: V3 = new V3(this.player.getViewDirection());
        impulseDirection.y = 0;
        impulseDirection = impulseDirection.normalize();

        const zRotation = this.player.getRotation().x;

        let verticalStrenth = charVals.verticalKnockbackRanks[0];
        if (zRotation < -10) {
            verticalStrenth = charVals.verticalKnockbackRanks[1];
        }
        if (zRotation < -20) {
            verticalStrenth = charVals.verticalKnockbackRanks[2];
        }
        if (zRotation < -30) {
            verticalStrenth = charVals.verticalKnockbackRanks[3];
        }
        if (zRotation < -40) {
            verticalStrenth = charVals.verticalKnockbackRanks[4];
        }
        if (zRotation < -50) {
            verticalStrenth = charVals.verticalKnockbackRanks[5];
        }

        this.moveComp.momentum = charVals.abilityTiers[this.punchTier].momentum;
        this.player.applyKnockback(
            impulseDirection.x,
            impulseDirection.z,
            charVals.abilityTiers[this.punchTier].momentum / 5,
            verticalStrenth
        );
        this.moveComp.verticalKnockback = verticalStrenth;
    }

    EndPunchMode(charVals) {
        this.inPunchMode = false;
        this.moveComp.momentum = GameData.MinMomentum;
        this.moveComp.postAbilityRunWindow = charVals.postPunchRunnableTicks;
        this.moveComp.EndInvulnerability();
        if (this.punchMiner && EntityUtil.isValid(this.punchMiner)) {
            this.punchMiner.triggerEvent("gm1_ord:despawn");
        }
    }
}
