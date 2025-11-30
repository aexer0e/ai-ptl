import { Entity, EntityDamageCause, EntityQueryOptions, EntityTypeFamilyComponent, TicksPerSecond } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityStore from "Store/Entity/EntityStore";
import BlockUtil from "Utilities/BlockUtil";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import Eggman from "../Eggman";
import PMPart from "./PMPart";

export default class PMDash extends PMPart {
    inDashMode = false;
    private dashTier = 0;
    private ticksInDashSlow = 0;
    private dashDir = V3.zero;
    private dashHorizontalKnockback = 0;
    private dashOrigin = { x: 0, y: 0, z: 0 };

    ProcessDash() {
        // Type safety appeasement
        if (!this.charComp.currentCharacter) return;

        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter];
        const tiers = charVals.abilityTiers;

        if (this.moveComp.landedSinceSneakAbility && this.moveComp.isSneaking) {
            this.moveComp.numberOfTicksSneakHasBeenHeld += 1;
            this.player.addEffect("slow_falling", 5, { amplifier: GameData.SneakSlowFall, showParticles: false });
            this.player.addEffect("slowness", 5, { amplifier: GameData.SneakSlowness, showParticles: false });
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

        this.moveComp.ticksSinceAbilityExecution += 1;
        if (this.moveComp.isSneaking === false && this.moveComp.numberOfTicksSneakHasBeenHeld > 0) {
            if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[0].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[1].sneakTicks
            ) {
                this.dashTier = 0;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[1].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[2].sneakTicks
            ) {
                this.dashTier = 1;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[2].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[3].sneakTicks
            ) {
                this.dashTier = 2;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[3].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[4].sneakTicks
            ) {
                this.dashTier = 3;
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[4].sneakTicks) {
                this.dashTier = 4;
            }

            if (this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[0].sneakTicks) {
                this.moveComp.momentum = GameData.MinMomentum;
                this.moveComp.inBallMode = false;
                this.moveComp.invulnerable = true;
                this.moveComp.inAbilityMode = true;
                this.inDashMode = true;
                this.moveComp.landedSinceSneakAbility = false;
                this.moveComp.ticksSinceAbilityAir = 0;
                this.moveComp.ticksSinceAbilityExecution = 0;
                this.ticksInDashSlow = 0;
                this.moveComp.SetLeggingsDurability(5);

                if (tiers[this.dashTier].breaksBlocks) this.moveComp.SetChestplateDurability(8);
                else this.moveComp.SetChestplateDurability(6);

                this.dashDir = new V3(this.player.getViewDirection()).normalize();
                this.dashOrigin = this.moveComp.playerLoc;

                const pitch = Math.abs(this.dashDir.asYawPitch().pitch);
                if (pitch < charVals.dashMinPitchForV) {
                    this.dashDir.y = 0;
                    this.dashDir = this.dashDir.normalize();
                }

                this.moveComp.verticalKnockback = this.dashDir.y * charVals.postDashVKnockback;
                const horizontalDir = new V3(this.dashDir.x, 0, this.dashDir.z);
                this.dashHorizontalKnockback = horizontalDir.length() * charVals.dashKnockback;

                if (tiers[this.dashTier].breaksBlocks && EntityStore.get(this.player, "canAbilityBreak")) {
                    // Dividing by 2 is very arbitrary, would be better to get the Crimson value for the miner hitbox to calculate this properly
                    const minerCount = Math.ceil(tiers[this.dashTier].maxDistance / 2) + 1;
                    const miners: Entity[] = [];
                    const charName = this.charComp.currentCharacter.replace("gm1_ord:", "").replace("_life", "");
                    const minerId = `gm1_ord:miner_${charName}`;
                    for (let i = 0; i < minerCount; i++) {
                        const minerPos = V3.add(this.dashOrigin, this.dashDir.multiply(i * 2));
                        if (!BlockUtil.InHeightBounds(minerPos, this.moveComp.dimension.id)) break;

                        const miner = this.moveComp.dimension.spawnEntity(minerId, minerPos);
                        miner.triggerEvent(`gm1_ord:tier_${this.dashTier}`);
                        miners.push(miner);
                    }
                    this.moveComp.timeout(() => {
                        for (let i = 0; i < miners.length; i++) {
                            miners[i].triggerEvent("gm1_ord:despawn");
                        }
                    }, 2);
                }
            }
            this.moveComp.numberOfTicksSneakHasBeenHeld = 0;
        }

        if (this.moveComp.inAbilityMode) {
            if (
                V3.distance(this.moveComp.prevLoc, this.moveComp.playerLoc) < 0.1 &&
                this.moveComp.ticksSinceAbilityExecution > charVals.dashDelay
            ) {
                this.ticksInDashSlow += 1;
            } else {
                this.ticksInDashSlow = 0;
            }

            const velocityOffset =
                MathUtil.rangeMap(
                    MathUtil.clamp(this.moveComp.momentum, 0.0, GameData.MaxMomentumRange),
                    20,
                    GameData.MaxMomentumRange,
                    0.0,
                    charVals.maxMomentumKnockback
                ) + this.moveComp.verticalKnockback;
            if (this.moveComp.ticksSinceAbilityExecution < charVals.dashDelay) {
                // Do nothing during the delay
                return;
            } else if (
                this.moveComp.ticksSinceAbilityExecution > 3 * TicksPerSecond ||
                this.ticksInDashSlow > 3 ||
                V3.distance(this.dashOrigin, this.moveComp.playerLoc) >= tiers[this.dashTier].maxDistance - velocityOffset
            ) {
                this.moveComp.inAbilityMode = false;
                this.inDashMode = false;
                this.moveComp.SetChestplateDurability(0);
                this.moveComp.SetLeggingsDurability(0);
                this.player.applyKnockback(0, 0, 0, 0);
                this.player.teleport(this.moveComp.playerLoc);
                this.moveComp.momentum = GameData.MinMomentum;
                this.moveComp.postAbilityRunWindow = charVals.postDashRunnableTicks;
                this.moveComp.ignoreSlowTicks = true;
                // If you've run into a wall, you shouldn't be sprinting around
                if (this.ticksInDashSlow > 5) {
                    this.moveComp.verticalKnockback = 0.0;
                }
            } else {
                // Add momentum here so it doesn't make you move during the delay period
                if (this.moveComp.ticksSinceAbilityExecution === charVals.dashDelay) {
                    this.moveComp.momentum = charVals.abilityTiers[this.dashTier].momentum;
                }
                // Dash movement
                this.player.applyKnockback(
                    this.dashDir.x,
                    this.dashDir.z,
                    this.dashHorizontalKnockback,
                    this.dashDir.y * charVals.dashKnockback
                );
                // Dash kill entities
                const query: EntityQueryOptions = { location: this.moveComp.playerLoc, maxDistance: tiers[this.dashTier].killRadius };
                const foundEntities = EntityUtil.getEntities(query, this.moveComp.dimension);
                for (const entity of foundEntities) {
                    if (this.EntityIsSlowKillable(entity)) {
                        EntityUtil.applyDamage(entity, charVals.abilityTiers[this.dashTier].dashSlowKillDamage, {
                            cause: EntityDamageCause.magic,
                        });
                        if (this.dashTier === 4 && entity.typeId === "gm1_ord:eggman")
                            MobComponentManager.getInstanceOfComponent(Eggman, entity).signalCriticalHit();
                    } else if (entity !== this.player && this.moveComp.EntityIsGeneralTargetable(entity)) {
                        entity.kill();
                    }
                }
            }
        }
    }

    EntityIsSlowKillable(entity: Entity): boolean {
        const familyComponent = entity.getComponent(EntityTypeFamilyComponent.componentId) as EntityTypeFamilyComponent;
        if (!familyComponent) return false;

        let validTarget = false;
        const families = familyComponent.getTypeFamilies();
        for (let i = 0; i < families.length; i++) {
            if (!GameData.DashSlowKillFamilies.has(families[i])) continue;
            validTarget = true;
            break;
        }
        return validTarget;
    }
}
