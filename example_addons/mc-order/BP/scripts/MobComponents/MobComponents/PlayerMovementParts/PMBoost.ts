import { Entity, EntityComponentTypes, EntityDamageCause, EntityItemComponent, EntityQueryOptions } from "@minecraft/server";
import GameData from "Game/GameData";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import PMPart from "./PMPart";

export default class PMBoost extends PMPart {
    inBoostMode = false;
    inFlightMode = false;
    groundedSinceFlight = false;
    descending = false;
    boostTier = 0;
    private miner: Entity | undefined = undefined;

    ProcessBoost() {
        // Type safety appeasement
        if (!this.charComp.currentCharacter) return;

        if (this.moveComp.isSneaking && !this.inBoostMode) {
            this.player.addEffect("slow_falling", 5, { amplifier: GameData.SneakSlowFall, showParticles: false });
            this.player.addEffect("slowness", 5, { amplifier: GameData.SneakSlowness, showParticles: false });
            this.moveComp.numberOfTicksSneakHasBeenHeld += 1;
            const charVals = GameData.CharDesignVars[this.charComp.currentCharacter];
            const tiers = charVals.abilityTiers;
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
        } else if (!this.moveComp.isSneaking && this.moveComp.numberOfTicksSneakHasBeenHeld > 0) {
            // Initiate Boost
            this.inBoostMode = true;
            this.moveComp.ticksSinceAbilityExecution = 0;
            this.moveComp.SetChestplateDurability(8);
            if (EntityStore.get(this.player, "canAbilityBreak")) {
                const charName = this.charComp.currentCharacter.replace("gm1_ord:", "").replace("_life", "");
                const minerId = `gm1_ord:miner_${charName}`;
                this.miner = this.moveComp.dimension.spawnEntity(minerId, this.moveComp.playerLoc);
            }
            // Add takeoff knockback
            let takeoffKnockback = new V3(this.player.getViewDirection());
            takeoffKnockback.y = 0;
            takeoffKnockback = takeoffKnockback.normalize();
            const charVals = GameData.CharDesignVars[this.charComp.currentCharacter];
            const tiers = charVals.abilityTiers;
            if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[0].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[1].sneakTicks
            ) {
                this.boostTier = 0;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[1].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[2].sneakTicks
            ) {
                this.boostTier = 1;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[2].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[3].sneakTicks
            ) {
                this.boostTier = 2;
            } else if (
                this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[3].sneakTicks &&
                this.moveComp.numberOfTicksSneakHasBeenHeld < tiers[4].sneakTicks
            ) {
                this.boostTier = 3;
            } else if (this.moveComp.numberOfTicksSneakHasBeenHeld >= tiers[4].sneakTicks) {
                this.boostTier = 4;
            }
            takeoffKnockback = takeoffKnockback.multiply(tiers[this.boostTier].forwardKnockback);
            takeoffKnockback.y = tiers[this.boostTier].upKnockback;
            this.moveComp.axialKnockback = this.moveComp.axialKnockback.addV3(takeoffKnockback);
            // Only do this after the above check runs
            this.moveComp.numberOfTicksSneakHasBeenHeld = 0;
        }

        if (this.inBoostMode) this.BoostModeTick();

        this.moveComp.ticksSinceAbilityExecution += 1;
    }

    BoostModeTick() {
        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter!];

        // moveVec.y is actually the Z axis
        const moveVec = this.player.inputInfo.getMovementVector();

        if (moveVec.y > 0 && !this.inFlightMode && !this.descending) this.StartFlightMode();
        else if (this.inFlightMode && moveVec.y <= 0) this.EndFlightMode();

        if (this.moveComp.isSneaking) {
            this.moveComp.ApplyKnockbackWithAxial(new V3(0, charVals.boostDescentYKnockback, 0));
            this.descending = true;
            if (this.inFlightMode) this.EndFlightMode();
        } else if (!this.moveComp.isSneaking && this.descending) {
            this.descending = false;
            this.inBoostMode = false;
            this.moveComp.SetChestplateDurability(0);
            this.moveComp.numberOfTicksSneakHasBeenHeld = 0;
            this.DespawnMiner();
            this.moveComp.SetChestplateDurability(0);
        } else if (this.inFlightMode) {
            // Move player
            this.FlightMovement();

            // Move miner
            if (this.miner) {
                const playerPos = this.moveComp.playerLoc;
                const forwardDirection = new V3(this.player.getViewDirection()).normalize();
                let minerPos = forwardDirection.multiply(charVals.blockBreakForwardOffset);
                minerPos = forwardDirection.addV3(playerPos);
                this.miner!.teleport(minerPos);
            }

            // Killing aura
            const query: EntityQueryOptions = { location: this.moveComp.playerLoc, maxDistance: charVals.boostKillRadius };
            const foundEntities = EntityUtil.getEntities(query, this.moveComp.dimension);
            for (const entity of foundEntities) {
                const entityType = entity.typeId;
                if (GameData.BoostSlowKillTypes.has(entityType))
                    EntityUtil.applyDamage(entity, charVals.boostSlowKillDamage, { cause: EntityDamageCause.magic });
                else if (this.moveComp.EntityIsGeneralTargetable(entity)) entity.kill();
                else if (entity !== this.player && entityType === "minecraft:item") {
                    const itemComp = entity.getComponent(EntityComponentTypes.Item) as EntityItemComponent;
                    const itemType = itemComp.itemStack.typeId;
                    if (!GameData.BoostKillItemBlacklist.has(itemType)) entity.kill();
                }
            }

            // Clear multi-homing targets
            if (this.moveComp.homingList.length > 0) this.moveComp.ClearHomingList();
        } else if (this.moveComp.homingTarget === undefined) {
            // Hover
            this.Hover();

            // Multi-homing
            this.moveComp.MultiHomingTargetTick(charVals.homingRayRadius, charVals.homingRayRadius);
            if (this.moveComp.jumpPressed && this.moveComp.homingList.length > 0) this.moveComp.ActivateMultiHoming();
        }
    }

    Hover() {
        const charVals = GameData.CharDesignVars[this.charComp.currentCharacter!];
        this.moveComp.ApplyKnockbackWithAxial(new V3(0, charVals.boostHoverAntiGravity, 0));
    }

    FlightMovement() {
        const charVals = GameData.CharDesignVars["gm1_ord:super_sonic_life"];
        let flightVector = new V3(this.player.getViewDirection()).normalize();
        let yKnockback = flightVector.y * charVals.flightKnockback + charVals.flightKnockbackAntiGravity;
        flightVector.y = 0;
        flightVector = flightVector.multiply(charVals.flightKnockback);

        // Scale yKnockback so that vertical and horizontal movement is the same speed
        // If yKnockback is negative, reduce it even more to negate gravity
        if (yKnockback < 0) yKnockback = yKnockback * 0.38;
        else yKnockback = yKnockback * 0.73;
        this.moveComp.ApplyKnockbackWithAxial(new V3(flightVector.x, yKnockback, flightVector.z));

        // for debugging
        // const velocity = new V3(this.player.getVelocity());
        // const xzVelocity = velocity.setY(0).length();
        // const yVelocity = velocity.y;
        // const allVelocity = velocity.length();
        // this.player.onScreenDisplay.setActionBar(
        //     `xz: ${xzVelocity.toFixed(3)}, y: ${yVelocity.toFixed(3)}, all: ${allVelocity.toFixed(3)}`
        // );
    }

    StartFlightMode() {
        if (this.inFlightMode) return;
        this.moveComp.SetLeggingsDurability(10);
        this.moveComp.SetBootsDurability(10);
        this.inFlightMode = true;
        this.groundedSinceFlight = false;
    }

    EndFlightMode() {
        this.inFlightMode = false;
        this.moveComp.SetLeggingsDurability(0);
        this.moveComp.SetBootsDurability(0);
    }

    DespawnMiner() {
        if (!this.miner) return;
        this.miner?.triggerEvent("gm1_ord:despawn");
        this.miner = undefined;
    }
}
