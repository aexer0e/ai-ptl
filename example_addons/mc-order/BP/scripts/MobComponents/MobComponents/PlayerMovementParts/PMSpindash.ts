import { Entity } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import PMPart from "./PMPart";

export default class PMSpindash extends PMPart {
    inSpindashMode = false;
    spindashTier = 0;
    private spindashMiner: Entity | null = null;

    ProcessSpinDash() {
        // Type safety appeasement
        if (!this.charComp.currentCharacter) return;

        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter];
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
            this.spindashTier = 0;
            if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[0].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[1].sneakTicks
            ) {
                this.spindashTier = 0;
                this.ExecuteSpinDash(1, charVals);
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[1].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[2].sneakTicks
            ) {
                this.spindashTier = 1;
                this.ExecuteSpinDash(2, charVals);
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[2].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[3].sneakTicks
            ) {
                this.spindashTier = 2;
                this.ExecuteSpinDash(3, charVals);
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[3].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[4].sneakTicks
            ) {
                this.spindashTier = 3;
                this.ExecuteSpinDash(4, charVals);
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[4].sneakTicks) {
                this.spindashTier = 4;
                this.ExecuteSpinDash(5, charVals);
            }
            this.moveComp.numberOfTicksSneakHasBeenHeld = 0;
            // Summon mining entity
            if (EntityStore.get(this.player, "canAbilityBreak")) {
                const charName = this.charComp.currentCharacter.replace("gm1_ord:", "").replace("_life", "");
                const minerId = `gm1_ord:miner_${charName}`;
                this.spindashMiner = this.moveComp.dimension.spawnEntity(minerId, this.moveComp.playerLoc);
                this.spindashMiner?.triggerEvent(`gm1_ord:tier_${this.spindashTier}`);
            }
        }

        this.moveComp.ticksSinceAbilityExecution += 1;
        if (this.moveComp.momentum < charVals.stopBlockBreakingMomentum && this.spindashMiner) {
            this.spindashMiner.triggerEvent("gm1_ord:despawn");
            this.spindashMiner = null;
            this.moveComp.SetChestplateDurability(6);
        } else if (
            this.moveComp.inAbilityMode &&
            this.moveComp.ticksSinceAbilityExecution > 3 &&
            this.moveComp.isOnGround &&
            (this.moveComp.isSneaking ||
                this.player.isSprinting ||
                this.moveComp.horzontal_speed === 0 ||
                this.moveComp.momentum <= charVals.exitSpindashMomentum ||
                this.moveComp.inHoverMode)
        ) {
            this.EndSpindash();
            this.moveComp.EndInvulnerability();
        } else if (this.moveComp.inAbilityMode && this.spindashMiner) {
            const playerPos = this.moveComp.playerLoc;
            let forwardDirection = new V3(this.player.getViewDirection());
            forwardDirection = forwardDirection.setY(0);
            forwardDirection = forwardDirection.normalize();
            let minerPos = forwardDirection.multiply(charVals.blockBreakForwardOffset);
            minerPos = forwardDirection.addV3(playerPos);
            this.spindashMiner.teleport(minerPos);
        }
    }

    EndSpindash() {
        this.moveComp.inAbilityMode = false;
        this.inSpindashMode = false;
        // This does not duplicate the code in ProcessSpinDash() because that miner despawn triggers from stopBlockBreakingMomentum,
        // and this despawn catches any other cases where spindash is ended before stopBlockBreakingMomentum has been reached
        if (this.spindashMiner) {
            this.spindashMiner.triggerEvent("gm1_ord:despawn");
            this.spindashMiner = null;
        }
        this.moveComp.SetChestplateDurability(0);
    }

    ExecuteSpinDash(tier: number, charVals) {
        this.moveComp.ticksSinceAbilityExecution = 0;
        this.moveComp.inAbilityMode = true;
        this.inSpindashMode = true;
        this.moveComp.landedSinceSneakAbility = false;
        this.moveComp.ticksSinceAbilityAir = 0;
        this.moveComp.invulnerable = true;

        this.moveComp.ClearAllReplacedBlocks();

        // this.moveComp.momentum = 45 + 15 * tier;
        let impulseDirection: V3 = new V3(this.player.getViewDirection());
        impulseDirection.y = 0;
        impulseDirection = impulseDirection.normalize();

        const zRotation = this.player.getRotation().x;

        let min = charVals.verticalKnockbackRanks[0][0];
        let max = charVals.verticalKnockbackRanks[0][1];
        if (zRotation < -10) {
            min = charVals.verticalKnockbackRanks[1][0];
            max = charVals.verticalKnockbackRanks[1][1];
        }
        if (zRotation < -20) {
            min = charVals.verticalKnockbackRanks[2][0];
            max = charVals.verticalKnockbackRanks[2][1];
        }
        if (zRotation < -30) {
            min = charVals.verticalKnockbackRanks[3][0];
            max = charVals.verticalKnockbackRanks[3][1];
        }
        if (zRotation < -40) {
            min = charVals.verticalKnockbackRanks[4][0];
            max = charVals.verticalKnockbackRanks[4][1];
        }
        if (zRotation < -50) {
            min = charVals.verticalKnockbackRanks[5][0];
            max = charVals.verticalKnockbackRanks[5][1];
        }

        const verticalStrenth = MathUtil.rangeMap(tier, 1, 5, min, max);
        let horizontalStrength = 0;

        this.moveComp.momentum = charVals.abilityTiers[tier - 1].momentum;
        if (this.moveComp.momentum > charVals.stopBlockBreakingMomentum) this.moveComp.SetChestplateDurability(8);
        else this.moveComp.SetChestplateDurability(6);
        horizontalStrength = charVals.abilityTiers[tier - 1].forwardKnockback;

        this.player.applyKnockback(impulseDirection.x, impulseDirection.z, horizontalStrength, verticalStrenth);
        this.moveComp.verticalKnockback = verticalStrenth;
    }
}
