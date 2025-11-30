import { Entity, EntityDamageCause, EntityIsTamedComponent, EntityQueryOptions } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import Eggman from "../Eggman";
import PMPart from "./PMPart";

export default class PMHammer extends PMPart {
    private hammerTier = 0;

    ProcessHammer() {
        // Type safety appeasement
        if (!this.charComp.currentCharacter) return;

        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter];
        const tiers = charVals.abilityTiers;

        if (this.moveComp.landedSinceSneakAbility && this.moveComp.isSneaking) {
            this.player.addEffect("slow_falling", 5, { amplifier: GameData.SneakSlowFall, showParticles: false });
            this.player.addEffect("slowness", 5, { amplifier: GameData.SneakSlowness, showParticles: false });
            this.moveComp.numberOfTicksSneakHasBeenHeld += 1;
            //BroadcastUtil.debug(`${this.moveComp.numberOfTicksSneakHasBeenHeld}`);
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
                this.hammerTier = 0;
                this.ExecuteHammer(charVals);
                this.moveComp.momentum = charVals.abilityTiers[this.hammerTier].momentum;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[1].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[2].sneakTicks
            ) {
                this.hammerTier = 1;
                this.ExecuteHammer(charVals);
                this.moveComp.momentum = charVals.abilityTiers[this.hammerTier].momentum;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[2].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[3].sneakTicks
            ) {
                this.hammerTier = 2;
                this.ExecuteHammer(charVals);
                this.moveComp.momentum = charVals.abilityTiers[this.hammerTier].momentum;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[3].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[4].sneakTicks
            ) {
                this.hammerTier = 3;
                this.ExecuteHammer(charVals);
                this.moveComp.momentum = charVals.abilityTiers[this.hammerTier].momentum;
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[4].sneakTicks) {
                this.hammerTier = 4;
                this.ExecuteHammer(charVals);
                this.moveComp.momentum = charVals.abilityTiers[this.hammerTier].momentum;
            }
            this.moveComp.numberOfTicksSneakHasBeenHeld = 0;
        }

        this.moveComp.ticksSinceAbilityExecution += 1;
        if (this.moveComp.inAbilityMode && this.moveComp.ticksSinceAbilityExecution > 3 && this.moveComp.trueIsOnGround) {
            this.moveComp.inAbilityMode = false;
            this.moveComp.momentum = GameData.MinMomentum;
            this.moveComp.postAbilityRunWindow = charVals.postHammerRunnableTicks;
            this.moveComp.DelayedChestplateDurability(7, 0, charVals.impactNotificationTicks);
            this.moveComp.EndInvulnerability();
            this.moveComp.dimension
                .getEntities({
                    location: this.moveComp.playerLoc,
                    maxDistance: this.HammerRadius(charVals),
                })
                .forEach((target) => {
                    this.HammerEntity(target, charVals);
                });
        } else if (this.moveComp.inAbilityMode && this.moveComp.ticksSinceAbilityExecution > 3) {
            //BroadcastUtil.debug(`Vertical velocity: ${this.player.getVelocity().y}`);
            let hitMonster = false;
            const query: EntityQueryOptions = {
                location: this.moveComp.playerLoc,
                maxDistance: 2,
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
                        location: this.moveComp.playerLoc,
                        maxDistance: this.HammerRadius(charVals),
                    })
                    .forEach((target) => {
                        this.HammerEntity(target, charVals);
                    });
                this.moveComp.inAbilityMode = false;
                this.moveComp.momentum = GameData.MinMomentum;
                this.moveComp.timeout(() => this.moveComp.ArrestVelocity(), 1);
                this.moveComp.postAbilityRunWindow = charVals.postHammerRunnableTicks;
                this.moveComp.DelayedChestplateDurability(7, 0, charVals.impactNotificationTicks);
                this.moveComp.EndInvulnerability();
            }
        }
    }

    HammerRadius(charVals): number {
        let vel = this.player.getVelocity().y;
        vel = MathUtil.clamp(vel, charVals.hammerVelocityMap[1], charVals.hammerVelocityMap[0]);
        return (
            charVals.abilityTiers[this.hammerTier].radius *
            MathUtil.rangeMap(
                vel,
                charVals.hammerVelocityMap[1],
                charVals.hammerVelocityMap[0],
                charVals.hammerAOEMultiplierMap[1],
                charVals.hammerAOEMultiplierMap[0]
            )
        );
    }

    HammerEntity(entity: Entity, charVals) {
        const tameableComponent = entity.getComponent(EntityIsTamedComponent.componentId) as EntityIsTamedComponent;
        if (tameableComponent) {
            return;
        }
        if (entity && entity !== this.player && this.moveComp.EntityIsGeneralTargetable(entity)) {
            const abilityVals = charVals.abilityTiers[this.hammerTier];
            EntityUtil.applyDamage(entity, abilityVals.damage, { damagingEntity: this.player, cause: EntityDamageCause.entityAttack });
            if (this.hammerTier === 4 && entity.typeId === "gm1_ord:eggman")
                MobComponentManager.getInstanceOfComponent(Eggman, entity).signalCriticalHit();
            const relativeDir = new V3(
                entity.location.x - this.moveComp.playerLoc.x,
                0,
                entity.location.z - this.moveComp.playerLoc.z
            ).normalize();
            entity.applyKnockback(relativeDir.x, relativeDir.z, abilityVals.targetHKnockback, abilityVals.targetVKnockback);
            // If Amy hits a target, post-ability momentum is removed
            this.moveComp.momentum = 0;
        }
    }

    ExecuteHammer(charVals) {
        this.moveComp.ticksSinceAbilityExecution = 0;
        this.moveComp.inAbilityMode = true;
        this.moveComp.SetChestplateDurability(6);
        this.moveComp.inBallMode = false;
        this.moveComp.landedSinceSneakAbility = false;
        this.moveComp.ticksSinceAbilityAir = 0;
        this.moveComp.invulnerable = true;

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

        const horzontalStrength = charVals.abilityTiers[this.hammerTier].forwardKnockback;

        this.player.applyKnockback(impulseDirection.x, impulseDirection.z, horzontalStrength, verticalStrenth);
        this.moveComp.verticalKnockback = verticalStrenth;
    }
}
