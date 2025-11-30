import {
    Block,
    Dimension,
    Entity,
    EntityComponentTypes,
    EntityDamageCause,
    EntityIsTamedComponent,
    EntityQueryOptions,
    EntityRideableComponent,
    EntityTypeFamilyComponent,
    EquipmentSlot,
    GameMode,
    GameRule,
    ItemDurabilityComponent,
    Player,
    TicksPerSecond,
    world,
} from "@minecraft/server";
import GameData, { JumpAbilityTypes, SneakAbilityTypes } from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import ReplacedBlock from "Order/ReplacedBlock";
import EntityStore from "Store/Entity/EntityStore";
import { EventCallback, EventClassName, EventName } from "Types/Events";
import BlockUtil from "Utilities/BlockUtil";
import DebugTimer from "Utilities/DebugTimer";
import EntityUtil from "Utilities/EntityUtil";
import GameRulesUtil from "Utilities/GameRulesUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import CharActivation from "./CharActivation";
import Eggman from "./Eggman";
import MobComponent from "./MobComponent";
import PMBoost from "./PlayerMovementParts/PMBoost";
import PMDash from "./PlayerMovementParts/PMDash";
import PMHammer from "./PlayerMovementParts/PMHammer";
import PMLiquidRunning from "./PlayerMovementParts/PMLiquidRunning";
import PMPunch from "./PlayerMovementParts/PMPunch";
import PMRingMagnet from "./PlayerMovementParts/PMRingMagnet";
import PMSlabPlacement from "./PlayerMovementParts/PMSlabPlacement";
import PMSpindash from "./PlayerMovementParts/PMSpindash";

export default class PlayerMovement extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];
    entity: Player | null;

    badnikBounceBuffer = 0;
    static readonly BadnikHitRadius = 3;

    private _momentum = 0;
    private _previousMappedMomentum = 0;
    get momentum() {
        return this._momentum;
    }
    set momentum(value) {
        this._momentum = value;

        if (!this.charComponent?.currentCharacter) return;

        // Ideally, this value should be set in a Crimson file and accessed both here and in char_effect_emitter and transform_boots,
        // But since we don't have that set up, it's hard-coded in multiple places
        const MAX_MOMENTUM_RANGE_FOR_CLIENT_COMMS = 10; // This is not a design variable, it's a constant used for the range map to communicate momentum to clients
        const charMaxMomentum = GameData.CharDesignVars[this.charComponent.currentCharacter].maxMomentum;
        const charMinMomentum = GameData.CharDesignVars[this.charComponent.currentCharacter].initialMomentum;
        const currentMomentum = MathUtil.clamp(this.momentum, charMinMomentum, charMaxMomentum);
        let mappedMomentum = MathUtil.rangeMap(currentMomentum, charMinMomentum, charMaxMomentum, 0, MAX_MOMENTUM_RANGE_FOR_CLIENT_COMMS);
        mappedMomentum = Math.ceil(mappedMomentum);

        // This check reduces the number of API calls per tick
        if (mappedMomentum === this._previousMappedMomentum) return;
        this._previousMappedMomentum = mappedMomentum;
        this.SetBootsDurability(mappedMomentum);
    }

    horzontal_speed = 0;
    horzontal_velocity: V3 = new V3(0, 0, 0);
    verticalVelocity = 0;
    numberOfTicksSneakHasBeenHeld = 0;
    numberOfTicksJumpHasBeenHeld = 0;
    numberOfTicksInTheAir = 0;
    jumpCache = false;
    ticksSinceAbilityExecution = 0;
    ticksSinceRideStart = 0;
    isRiding = false;
    inBallMode = false;
    slabPosition = new V3();
    charComponent: CharActivation | null = null;
    dimension: Dimension;
    private _invulnerable = false;
    get invulnerable() {
        return this._invulnerable;
    }
    set invulnerable(value) {
        this._invulnerable = value;

        // If setting invulnerable to false, check to see if the helmet is in "player recently taken damage" state
        if (!this.charComponent?.currentCharacter || value) return;

        const equipment = InventoryUtil.getEquipment(this.entity!);
        const helmet = equipment.getEquipment(EquipmentSlot.Head);
        if (helmet) {
            const durabilityComp = helmet.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
            // Only set durability to 0 if it's in the "player recently taken damage" state
            if (durabilityComp && durabilityComp.damage === 3) {
                durabilityComp.damage = 0;
                equipment.setEquipment(EquipmentSlot.Head, helmet);
            }
        }
    }
    vulnerabilityScheduled = false;
    airSneakMode = false;
    currentGameMode = GameMode.survival;
    flightQueryLock = false;
    postAbilityRunWindow = 0;
    isSneaking = false;
    inAbilityMode = false;

    static readonly homingHeightOffset = 2; // Not a design variable, don't edit this

    // Momentum variables
    ignoreSlowTicks = false;
    playerLoc = V3.zero;
    prevLoc = V3.zero;
    slowVelocityTicks = 0;
    wasSprinting = true;
    axialKnockback = new V3(0, 0, 0); // y value here can be used for external forces like springs, but use verticalKnockback for abilities
    isSprinting = false;

    // Jump and airtime variables
    isOnGround = true;
    trueIsOnGround = true;
    landedSinceSneakAbility = true;
    ticksSinceAbilityAir = 0;
    verticalKnockback = 0.0;
    jumpPressed = false;
    jumpNumber = 0;
    wasOnGround = false;

    // Homing variables
    canTryHoming = false;
    homingTarget: undefined | Entity = undefined;
    homingTargetTimeoutLock = false;
    homingList: Entity[] = [];
    homingIndicator: Entity | undefined = undefined;
    homingIndicators: Entity[] = [];
    shouldInstantRemoveIndicator: boolean = true;
    homingVelocity: V3 = V3.zero;
    slowHomingTicks = 0;
    homingTimer = 0;
    homingPauseTimer = 0;

    // Tails variables
    inHoverMode = false;
    ticksSinceHoverStart = 0;
    ticksInHoverCycle = 0;
    hoverUsed = false;
    hoverUpCycle = true;

    // Knuckles variables
    inGlideMode = false;
    glideUsed = false;

    static letters: Map<string, Block> = new Map();

    // PM Parts
    pmLiquidRunning: PMLiquidRunning;
    pmPunch: PMPunch;
    pmHammer: PMHammer;
    pmDash: PMDash;
    pmSpindash: PMSpindash;
    pmSlabPlacement: PMSlabPlacement;
    pmRingMagnet: PMRingMagnet;
    pmBoost: PMBoost;

    constructor(entity: Entity) {
        super(entity, 1);

        // Set up subcomponents
        this.pmLiquidRunning = new PMLiquidRunning(entity as Player, this);
        this.pmHammer = new PMHammer(entity as Player, this);
        this.pmDash = new PMDash(entity as Player, this);
        this.pmPunch = new PMPunch(entity as Player, this);
        this.pmSpindash = new PMSpindash(entity as Player, this);
        this.pmSlabPlacement = new PMSlabPlacement(entity as Player, this);
        this.pmRingMagnet = new PMRingMagnet(entity as Player, this);
        this.pmBoost = new PMBoost(entity as Player, this);

        this.onWorldEvent("WorldAfterEvents", "effectAdd", (event) => {
            if (!EntityUtil.isValid(event.entity)) return;
            if (event.entity.id !== this.entity!.id) return;
            if (
                event.entity === this.entity &&
                MobComponentManager.getInstanceOfComponent(CharActivation, this.entity).currentCharacter !== undefined &&
                GameData.EffectImmunities.includes(event.effect.typeId)
            ) {
                if (event.effect.typeId === "poison") {
                    // Yes, this is actually necessary, because poison and fatal_poison have the same typeId, apparently
                    this.entity.removeEffect("fatal_poison");
                }
                this.entity.removeEffect(event.effect.typeId);
            }
        });

        // No riding entities as a Sonic character
        this.onWorldEvent("WorldBeforeEvents", "playerInteractWithEntity", (event) => {
            if (!EntityUtil.isValid(this.entity) || event.player.id !== this.entityId || !this.charComponent?.currentCharacter) return;
            const rideComp = event.target.getComponent(EntityComponentTypes.Rideable) as EntityRideableComponent;
            if (rideComp) event.cancel = true;
        });

        // Track gamemode changes
        if (this.entity) this.currentGameMode = this.entity.getGameMode();
        this.onWorldEvent("WorldAfterEvents", "playerGameModeChange", (event) => {
            if (!EntityUtil.isValid(this.entity) || event.player.id !== this.entityId) return;
            this.currentGameMode = event.player.getGameMode();
        });
    }

    process(): void {
        if (!EntityUtil.isValid(this.entity) || this.currentGameMode === GameMode.spectator) return;

        // Get CharActivation component
        if (!this.charComponent) {
            this.charComponent = MobComponentManager.getInstanceOfComponent(CharActivation, this.entity);
            this.pmLiquidRunning.charComp = this.charComponent;
            this.pmHammer.charComp = this.charComponent;
            this.pmDash.charComp = this.charComponent;
            this.pmPunch.charComp = this.charComponent;
            this.pmSpindash.charComp = this.charComponent;
            this.pmSlabPlacement.charComp = this.charComponent;
            this.pmBoost.charComp = this.charComponent;
            this.pmRingMagnet.charComp = this.charComponent;
        }
        if (!this.charComponent) return;
        if (this.charComponent.currentCharacter === undefined) {
            this.landedSinceSneakAbility = true;
            this.ignoreSlowTicks = false;
            return;
        }

        // Cache variables
        DebugTimer.countStart("PM.initVars");
        this.playerLoc = new V3(this.entity.location);
        this.dimension = this.entity.dimension;
        this.isSneaking = this.entity.isSneaking;
        this.isSprinting = this.entity.isSprinting;

        // Calc horizontal speed
        const velocity = new V3(this.entity.getVelocity());
        this.horzontal_velocity = new V3(velocity.x, 0, velocity.z);
        this.horzontal_speed = new V3(velocity.x, 0, velocity.z).length();
        this.verticalVelocity = velocity.y;

        DebugTimer.countEndAndStart("PM.UpdateCoyoteTime");
        this.UpdateCoyoteTime();
        DebugTimer.countEndAndStart("PM.ApplyMomentumChange");
        this.ApplyMomentumChange();
        DebugTimer.countEndAndStart("PM.ApplyAxialKnockbackChange");
        this.ApplyAxialKnockbackChange();
        DebugTimer.countEndAndStart("PM.UpdateVerticalKnockback");
        this.UpdateVerticalKnockback();
        DebugTimer.countEndAndStart("PM.ProcessLiquidRunning");
        this.pmLiquidRunning.ProcessLiquidRunning();
        DebugTimer.countEndAndStart("PM.ApplyMovementKnockback");
        this.ApplyMovementKnockback();
        if (CharActivation.SUPER_TOKENS.has(this.charComponent.currentCharacter)) {
            DebugTimer.countEndAndStart("PM.RingMagnet");
            this.pmRingMagnet.PullRings(this.dimension);
        }
        switch (GameData.CharDesignVars[this.charComponent.currentCharacter].sneakAbility) {
            case SneakAbilityTypes.Spindash: {
                DebugTimer.countEndAndStart("PM.ProcessSpinDash");
                this.pmSpindash.ProcessSpinDash();
                break;
            }
            case SneakAbilityTypes.Boost: {
                DebugTimer.countEndAndStart("PM.ProcessBoost");
                this.pmBoost.ProcessBoost();
                break;
            }
            case SneakAbilityTypes.Punch: {
                DebugTimer.countEndAndStart("PM.ProcessKnucklesPunch");
                this.pmPunch.ProcessPunch();
                break;
            }
            case SneakAbilityTypes.Hammer: {
                DebugTimer.countEndAndStart("PM.ProcessAmyHammer");
                this.pmHammer.ProcessHammer();
                break;
            }
            case SneakAbilityTypes.Dash: {
                DebugTimer.countEndAndStart("PM.ProcessShadowDash");
                this.pmDash.ProcessDash();
                break;
            }
        }
        DebugTimer.countEndAndStart("PM.ProcessJumpAbilities");
        this.ProcessJumpAbilities();

        DebugTimer.countEndAndStart("PM.ProcessStepUp");
        // This check ensures that you don't place slabs while breaking blocks in Spindash mode
        if (
            !this.pmSpindash.inSpindashMode ||
            this.momentum <= GameData.CharDesignVars[this.charComponent.currentCharacter].stopBlockBreakingMomentum
        ) {
            this.pmSlabPlacement.ProcessStepUp();
        }

        if (EntityStore.get(this.entity, "canRunBreak")) {
            DebugTimer.countEndAndStart("PM.ProcessRunningBlockBreaking");
            this.ProcessRunningBlockBreaking();
        }

        // Flight query
        if (this.currentGameMode === GameMode.creative) {
            const isFlying = this.entity!.isFlying;
            if (isFlying && !this.flightQueryLock) {
                this.SetLeggingsDurability(7);
                this.flightQueryLock = true;
            } else if (!isFlying && this.flightQueryLock) {
                this.SetLeggingsDurability(0);
                this.flightQueryLock = false;
            }
        }

        DebugTimer.countEndAndStart("PM.BallModeCalcs");
        //Ball mode
        if (
            (this.entity.isJumping || this.pmSpindash.inSpindashMode) &&
            (!this.inAbilityMode || this.pmSpindash.inSpindashMode) &&
            !this.inHoverMode
        ) {
            this.inBallMode = true;
            this.invulnerable = true;
            this.entity.addTag("gm1_ord_in_ball_mode");
        } else if (this.inBallMode && this.trueIsOnGround) {
            this.inBallMode = false;
            this.EndInvulnerability();
            this.entity.removeTag("gm1_ord_in_ball_mode");
        }

        DebugTimer.countEndAndStart("PM.BadnikBounce");

        // Re-caching the position is not ideal, but in this case it's changed so much by preceding code
        // that not doing it causes badnik bounce to break
        this.playerLoc = new V3(this.entity.location);

        this.ProcessBadnikBounce();

        this.pmSlabPlacement.PruneReplacedBlocks();

        // Track previous player location, used for running into walls
        this.prevLoc = this.playerLoc;

        if (this.badnikBounceBuffer > 0) {
            this.badnikBounceBuffer--;
        }

        // Record this only AFTER everything else is done
        this.wasSprinting = this.isSprinting;

        DebugTimer.countEnd();
    }

    UpdateCoyoteTime() {
        if (this.entity!.isOnGround === false) {
            this.trueIsOnGround = false;
            this.numberOfTicksInTheAir += 1;
            if (this.numberOfTicksInTheAir > GameData.CoyoteTime) {
                this.isOnGround = false;
            }
        } else {
            this.numberOfTicksInTheAir = 0;
            this.isOnGround = true;
            this.trueIsOnGround = true;
        }
    }

    ClearAllReplacedBlocks() {
        for (let i = this.pmSlabPlacement.replacedBlocks.length - 1; i >= 0; i--) {
            const block: ReplacedBlock = this.pmSlabPlacement.replacedBlocks[i];
            world.getDimension(block.dimension).setBlockType(block.location, block.typeId);
        }
        this.pmSlabPlacement.replacedBlocks = [];
    }

    ApplyMomentumChange() {
        if (!this.charComponent?.currentCharacter) return;
        // Calc how much to add to momentum
        const charVals = GameData.CharDesignVars[this.charComponent.currentCharacter];

        // Process post-ability momentum window
        if (this.postAbilityRunWindow > 0) {
            if (this.isSprinting) {
                this.postAbilityRunWindow = 0;
                this.momentum = charVals.maxMomentum;
                this.slowVelocityTicks = 0;
            } else {
                this.postAbilityRunWindow -= 1;
            }
        }

        if (
            this.momentum > GameData.MinMomentum &&
            V3.distance(this.playerLoc, this.prevLoc) < GameData.MinRunDistPerTick &&
            !this.ignoreSlowTicks &&
            !this.inGlideMode &&
            !this.pmDash.inDashMode
        ) {
            this.slowVelocityTicks += 1;
            if (this.slowVelocityTicks > GameData.SlowTicksBeforeMinMomentum) {
                this.momentum = GameData.MinMomentum;
                this.CheckMinMomentumClearSlabs();
                if (this.pmBoost.inFlightMode) this.pmBoost.EndFlightMode();
            }
        } else {
            this.slowVelocityTicks = 0;
        }

        if (this.isSneaking && !this.pmBoost.inBoostMode) {
            this.momentum = GameData.MinMomentum;
            this.CheckMinMomentumClearSlabs();
        } else if (
            !this.isSprinting &&
            this.ticksSinceAbilityExecution > 31 &&
            this.isRiding === false &&
            this.pmSpindash.inSpindashMode === false &&
            this.pmPunch.inPunchMode === false &&
            !this.pmBoost.inFlightMode &&
            (this.isOnGround || this.pmLiquidRunning.isWaterRunning || this.pmLiquidRunning.isSnowRunning)
        ) {
            this.momentum = GameData.MinMomentum;
            this.CheckMinMomentumClearSlabs();
        } else if (this.inGlideMode && this.momentum < charVals.maxMomentum) {
            if (this.momentum < charVals.glideMomentumCap) this.momentum += charVals.glideAcceleration;
        } else if (this.isSprinting && this.momentum < charVals.maxMomentum && !this.inHoverMode) {
            if (!this.wasSprinting) {
                this.momentum = charVals.initialMomentum;
            } else {
                this.momentum += charVals.acceleration;
            }
        }

        if (
            this.momentum > charVals.maxMomentum ||
            this.pmSpindash.inSpindashMode ||
            this.pmPunch.inPunchMode ||
            this.inGlideMode ||
            this.inHoverMode
        ) {
            if (this.pmSpindash.inSpindashMode) {
                this.momentum -= charVals.spindashDeceleration;
            } else if (this.pmPunch.inPunchMode) {
                this.momentum -= charVals.punchDeceleration;
            } else if (this.inGlideMode) {
                if (this.momentum > charVals.glideMomentumCap) this.momentum -= charVals.acceleration;
            } else if (this.inHoverMode) {
                if (this.momentum > charVals.hoverMomentumCap) this.momentum -= charVals.acceleration;
                if (this.momentum < charVals.hoverMomentumMin) this.momentum = charVals.hoverMomentumMin;
            } else {
                this.momentum -= charVals.acceleration;
            }
            this.CheckMinMomentumClearSlabs();
        }
        this.momentum = MathUtil.clamp(this.momentum, GameData.MinMomentum, Number.MAX_VALUE);
        //BroadcastUtil.say(this.momentum.toString());
    }

    UpdateVerticalKnockback() {
        if (
            !this.processInterval ||
            this.pmDash.inDashMode ||
            this.inHoverMode ||
            this.inGlideMode ||
            this.pmLiquidRunning.isWaterRunning ||
            this.pmLiquidRunning.isSnowRunning
        )
            return;

        if (this.isSneaking && !this.trueIsOnGround && (this.numberOfTicksSneakHasBeenHeld === 1 || this.airSneakMode)) {
            this.verticalKnockback = GameData.SneakFallKnockback;
            if (this.numberOfTicksSneakHasBeenHeld === 1) this.airSneakMode = true;
        } else if (this.trueIsOnGround || this.momentum === GameData.MinMomentum) {
            this.verticalKnockback = 0.0;
            this.airSneakMode = false;
        } else {
            this.verticalKnockback = MathUtil.clamp(
                this.verticalKnockback - GameData.FallAcceleration * this.processInterval,
                -GameData.MaxFallKnockback,
                9001.0
            );
        }
    }

    ApplyAxialKnockbackChange() {
        const speed = this.axialKnockback.length();
        if (speed > 0) {
            const newSpeed = speed - GameData.AxialKnockbackDeceleration;
            if (newSpeed <= 0) {
                this.axialKnockback = V3.zero;
            } else {
                this.axialKnockback = this.axialKnockback.multiply(newSpeed / speed);
            }
        }
    }

    CheckMinMomentumClearSlabs() {
        if (this.momentum < GameData.MinMomentumForSlabs && this.pmSlabPlacement.replacedBlocks.length > 0) {
            this.ClearAllReplacedBlocks();
        }
    }

    ApplyMovementKnockback() {
        if (
            this.entity!.getGameMode() == GameMode.spectator ||
            (!this.isSprinting &&
                !this.pmDash.inDashMode &&
                !this.homingTarget &&
                this.momentum <= GameData.MinMomentum &&
                this.verticalKnockback == 0)
        )
            return;

        // Normal movement
        if (
            this.homingTarget === undefined &&
            this.charComponent?.currentCharacter &&
            !this.pmBoost.inFlightMode &&
            (this.entity!.isOnGround ||
                this.inHoverMode ||
                this.inGlideMode ||
                this.pmLiquidRunning.isWaterRunning ||
                this.pmLiquidRunning.isSnowRunning)
        ) {
            const momentumForKnockback = MathUtil.clamp(this.momentum, 0.0, GameData.MaxMomentumRange); // If we don't do this, rangeMap becomes effectively unbounded
            const forwardKnockback = MathUtil.rangeMap(
                momentumForKnockback,
                20,
                GameData.MaxMomentumRange,
                0.0,
                GameData.CharDesignVars[this.charComponent.currentCharacter].maxMomentumKnockback
            );
            let momentumKnockback = new V3(this.entity!.getViewDirection());
            momentumKnockback.y = 0;
            momentumKnockback = new V3(momentumKnockback).normalize();
            momentumKnockback = momentumKnockback.multiply(forwardKnockback);
            momentumKnockback.y = this.verticalKnockback;

            this.ApplyKnockbackWithAxial(momentumKnockback);
        } else if (this.homingTarget && this.charComponent && this.charComponent.currentCharacter) {
            // -- Homing attack movement -- //

            // Cancel Homing if the target is no longer valid
            if (!EntityUtil.isValid(this.homingTarget)) {
                if (this.homingList.length > 0) this.NextHomingTarget();
                else this.EndHoming();
                return;
            }

            // Cancel Homing if you start sprinting
            if (this.isSprinting && !this.wasSprinting) {
                this.EndHoming();
                return;
            }

            // Cancel Homing if the player is moving very slowly (i.e. they got stuck)
            // Ignore move distance if the pauser timer is active
            const moveDist = V3.distance(this.prevLoc, this.playerLoc);
            if (moveDist < GameData.HomingSlowThreshold && this.homingPauseTimer === 0) this.slowHomingTicks++;
            else this.slowHomingTicks = 0;

            if (this.slowHomingTicks >= GameData.SlowTicksBeforeHomingEnd) {
                this.EndHoming();
                this.slowHomingTicks = 0;
                return;
            }

            // Cancel Homing if it times out, not counting pause periods
            if (this.homingPauseTimer === 0) this.homingTimer++;
            if (this.homingTimer >= GameData.HomingTimeout) {
                this.EndHoming();
                return;
            }

            // Get the knockback velocity we are accelerating towards
            let targetVelocity: V3;
            if (this.homingPauseTimer === 0) {
                // If not in a pause, get target velocity towards next Homing target
                targetVelocity = this.CalcTargetHomingVelocity();
            } else {
                // If in a pause, set target velocity to zero
                targetVelocity = V3.zero;
                this.homingPauseTimer--;
                if (this.homingPauseTimer === 0) this.SetLeggingsDurability(1);
            }

            // Apply acceleration to our current knockback velocity based on the difference
            const charVals = GameData.CharDesignVars[this.charComponent.currentCharacter];
            const velocityDiff = targetVelocity.subtractV3(this.homingVelocity);
            const differenceMagnitude = velocityDiff.length();
            const accel = differenceMagnitude < charVals.homingAcceleration ? differenceMagnitude : charVals.homingAcceleration;
            this.homingVelocity = this.homingVelocity.addV3(velocityDiff.normalize().multiply(accel));

            // Apply our current knockback velocity to the player
            const yKnockback = this.homingVelocity.y;
            let xzKnockback = new V3(this.homingVelocity.x, 0, this.homingVelocity.z);
            const xzMagnitude = xzKnockback.length();
            xzKnockback = xzKnockback.normalize();
            this.entity!.applyKnockback(xzKnockback.x, xzKnockback.z, xzMagnitude, yKnockback);
        }
    }

    CalcTargetHomingVelocity(): V3 {
        if (!this.homingTarget) return V3.zero;

        let targetLoc: V3;

        try {
            targetLoc = new V3(this.homingTarget.location);
            targetLoc.y += PlayerMovement.homingHeightOffset - 0.5;
        } catch (e) {
            // If the attempt to get the homing target's location fails, assume target is totally unreachable and cancel Homing
            this.homingTarget = undefined;
            this.SetLeggingsDurability(0);
            this.canTryHoming = true;
            this.landedSinceSneakAbility = true;
            this.ignoreSlowTicks = false;
            return V3.zero;
        }

        const familyComp = this.homingTarget.getComponent(EntityTypeFamilyComponent.componentId) as EntityTypeFamilyComponent;
        const isSpring = familyComp && familyComp.hasTypeFamily("spring");
        const charVals = GameData.CharDesignVars[this.charComponent!.currentCharacter!];
        const dir = V3.subtract(targetLoc, this.playerLoc).normalize();
        const dist = V3.distance(targetLoc, this.playerLoc);
        const gravityOffset = 0.05;
        let targetVelocity: V3;
        if (dist >= charVals.homingCloseThreshold - (isSpring ? 1.5 : 0)) {
            targetVelocity = new V3(
                dir.x * charVals.homingKnockbackFar,
                dir.y * charVals.homingKnockbackFar + gravityOffset,
                dir.z * charVals.homingKnockbackFar
            );
        } else {
            targetVelocity = new V3(
                dir.x * charVals.homingKnockbackClose,
                dir.y * charVals.homingKnockbackClose + gravityOffset,
                dir.z * charVals.homingKnockbackClose
            );
        }
        return targetVelocity;
    }

    ApplyKnockbackWithAxial(knockbackVector: V3) {
        const yKnockback = knockbackVector.y + this.axialKnockback.y;
        knockbackVector.y = 0;

        knockbackVector.x += this.axialKnockback.x;
        knockbackVector.z += this.axialKnockback.z;

        const knockbackMagnitude = knockbackVector.length();
        knockbackVector = knockbackVector.normalize();

        this.entity!.applyKnockback(knockbackVector.x, knockbackVector.z, knockbackMagnitude, yKnockback);
    }

    EndInvulnerability() {
        if (this.vulnerabilityScheduled || !this.invulnerable) {
            return;
        }

        this.vulnerabilityScheduled = true;
        this.timeout(() => {
            this.invulnerable = false;
            this.vulnerabilityScheduled = false;
        }, GameData.EndInvulnerabilityDelay * TicksPerSecond);
    }

    SetChestplateDurability(newValue: number) {
        const equipment = InventoryUtil.getEquipment(this.entity!);
        const chestplate = equipment.getEquipment(EquipmentSlot.Chest);
        if (chestplate) {
            const durabilityComp = chestplate.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
            if (durabilityComp) {
                durabilityComp.damage = newValue;
                equipment.setEquipment(EquipmentSlot.Chest, chestplate);
            }
        }
    }

    DelayedChestplateDurability(valueOne: number, valueTwo: number, delay: number) {
        this.SetChestplateDurability(valueOne);
        this.timeout(() => {
            this.SetChestplateDurability(valueTwo);
        }, delay);
    }

    SetLeggingsDurability(newValue: number) {
        if (!EntityUtil.isValid(this.entity)) return;
        const equipment = InventoryUtil.getEquipment(this.entity);
        const leggings = equipment.getEquipment(EquipmentSlot.Legs);
        if (leggings) {
            const durabilityComp = leggings.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
            if (durabilityComp) {
                // There are a variety of SetLeggingsDurability() calls which try to signal the end of something and set damage to 0
                // If you are still holding spacebar though, we instead want damage 9
                // It's easier to do this check here instead of at every SetLeggingsDurability() call
                if (this.jumpPressed && newValue === 0) newValue = 9;

                durabilityComp.damage = newValue;
                equipment.setEquipment(EquipmentSlot.Legs, leggings);
            }
        }
    }

    // Remember to cache the value whenever you can!
    GetLeggingsDurability(): number {
        if (!EntityUtil.isValid(this.entity)) return -1;

        const equipment = InventoryUtil.getEquipment(this.entity);
        const leggings = equipment.getEquipment(EquipmentSlot.Legs);

        if (!leggings) return -1;

        const durabilityComp = leggings.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
        return durabilityComp.damage;
    }

    SetBootsDurability(newValue: number) {
        const equipment = InventoryUtil.getEquipment(this.entity!);
        const boots = equipment.getEquipment(EquipmentSlot.Feet);

        if (!boots) return;

        const durabilityComp = boots.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

        if (!durabilityComp) return;

        durabilityComp.damage = newValue;
        equipment.setEquipment(EquipmentSlot.Feet, boots);
    }

    // Targetable if the entity has ANY hostile families AND no passive families and NOT a tamed mob
    EntityIsHostileTargetable(entity: Entity): boolean {
        const tameableComponent = entity.getComponent(EntityIsTamedComponent.componentId) as EntityIsTamedComponent;
        if (tameableComponent) return false;

        const familyComponent = entity.getComponent(EntityTypeFamilyComponent.componentId) as EntityTypeFamilyComponent;
        if (!familyComponent) return false;

        let validTarget = false;
        const families = familyComponent.getTypeFamilies();
        for (let i = 0; i < families.length; i++) {
            if (GameData.PassiveTargetFamilies.has(families[i]) || GameData.NeverTargetFamilies.has(families[i])) return false;
            if (!GameData.HostileTargetFamilies.has(families[i])) continue;
            validTarget = true;
            break;
        }
        return validTarget;
    }

    // Targetable if the entity has ANY hostile OR passive families and NOT a tamed mob
    EntityIsGeneralTargetable(entity: Entity): boolean {
        if (GameRulesUtil.get(GameRule.Pvp) && entity.typeId == "minecraft:player" && entity.id != this.entity!.id) return true;

        const tameableComponent = entity.getComponent(EntityIsTamedComponent.componentId) as EntityIsTamedComponent;
        if (tameableComponent) return false;

        const familyComponent = entity.getComponent(EntityTypeFamilyComponent.componentId) as EntityTypeFamilyComponent;
        if (!familyComponent) return false;

        let validTarget = false;
        const families = familyComponent.getTypeFamilies();
        for (let i = 0; i < families.length; i++) {
            if (GameData.NeverTargetFamilies.has(families[i])) return false;
            if (
                !GameData.HostileTargetFamilies.has(families[i]) &&
                (!GameData.PassiveTargetFamilies.has(families[i]) || !EntityStore.get(this.entity!, "canDamagePassiveMobs"))
            )
                continue;
            validTarget = true;
            break;
        }
        return validTarget;
    }

    ProcessRunningBlockBreaking() {
        if (this.momentum < GameData.MinMomentumForBlockBreaking) return;
        const playerPos = this.playerLoc;
        let playerDir = new V3(this.entity!.getViewDirection());
        playerDir.y = 0;
        playerDir = playerDir.normalize();
        const center = V3.add(playerPos, playerDir.multiply(GameData.RunningBreakForwardOffset));
        center.y += GameData.RunningBreakYOffset;

        // Actual radius number for calculations
        // Designer variable is meant to be relatively easy to read & understand
        const radiusFar = GameData.RunningBlockBreakRadiusFar - 1;
        const radiusClose = GameData.RunningBlockBreakRadiusClose - 1;

        for (let x = center.x - radiusFar; x <= center.x + radiusFar; x++) {
            const inCloseX = x >= center.x - radiusClose && x <= center.x + radiusClose;
            for (let z = center.z - radiusFar; z <= center.z + radiusFar; z++) {
                const inCloseZ = z >= center.z - radiusClose && z <= center.z + radiusClose;
                for (let y = center.y; y <= center.y + GameData.RunningBlockBreakHeight; y++) {
                    const id = V3.asBlockLocationId(x, y, z);
                    if (this.pmSlabPlacement.recentlyProcessedBlockLocationsBreaking.has(id)) {
                        continue;
                    }
                    this.pmSlabPlacement.recentlyProcessedBlockLocationsBreaking.add(id);
                    this.timeout(() => {
                        this.pmSlabPlacement.recentlyProcessedBlockLocationsBreaking.delete(id);
                    }, 30);
                    const block = BlockUtil.GetBlock(this.dimension, { x: x, y: y, z: z });
                    const blockType = block?.typeId;
                    const inCloseRadius = inCloseX && inCloseZ;
                    if (
                        block &&
                        blockType &&
                        (GameData.RunBeakableBlocksFar.has(blockType) || (inCloseRadius && GameData.RunBeakableBlocksClose.has(blockType)))
                    ) {
                        const loc = block.location;
                        if (GameData.NoLootTableBlocks.has(blockType))
                            this.dimension.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air replace`);
                        else this.dimension.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
                    } else if (block && blockType === "gm1_ord:invisible_slab") {
                        const loc = block.location;
                        for (let i = this.pmSlabPlacement.replacedBlocks.length - 1; i >= 0; i--) {
                            const replacedBlock = this.pmSlabPlacement.replacedBlocks[i];
                            if (
                                replacedBlock.location.equals(loc) &&
                                (GameData.RunBeakableBlocksFar.has(replacedBlock.typeId) ||
                                    (inCloseRadius && GameData.RunBeakableBlocksFar.has(replacedBlock.typeId)))
                            ) {
                                if (!GameData.NoLootTableBlocks.has(replacedBlock.typeId)) {
                                    this.dimension.setBlockType(loc, replacedBlock.typeId);
                                    this.dimension.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
                                    this.dimension.setBlockType(loc, "gm1_ord:invisible_slab");
                                }
                                replacedBlock.typeId = "minecraft:air";
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    ResetRunningStates() {
        this.pmLiquidRunning.isWaterRunning = false;
        this.pmLiquidRunning.isSnowRunning = false;
        this.SetLeggingsDurability(0);
    }

    // Added here as a non-protected method so PMParts can use it
    timeout(callback: () => void, delay: number, condition?: () => boolean) {
        return super.timeout(callback, delay, condition);
    }

    onWorldEvent<ClassName extends EventClassName, Name extends EventName<ClassName>>(
        type: ClassName,
        event: Name,
        callback: EventCallback<ClassName, Name>
    ) {
        super.onWorldEvent(type, event, callback);
    }

    OnGroundOrLiquid() {
        return this.isOnGround || this.pmLiquidRunning.isWaterRunning || this.pmLiquidRunning.isSnowRunning;
    }

    TrueOnGroundOrLiquid() {
        return this.trueIsOnGround || this.pmLiquidRunning.isWaterRunning || this.pmLiquidRunning.isSnowRunning;
    }

    ArrestVelocity() {
        const velocityMultiplier = 0.8;
        let currentVel = new V3(this.entity!.getVelocity());
        const yVel = currentVel.y;
        const horizontalMagnitude = currentVel.length();
        currentVel = currentVel.normalize();
        this.entity!.applyKnockback(currentVel.x, currentVel.z, -horizontalMagnitude * velocityMultiplier, -yVel * velocityMultiplier);
    }

    ProcessBadnikBounce() {
        if (
            (this.inBallMode && this.numberOfTicksInTheAir >= 10) ||
            (this.verticalVelocity < 0 && this.jumpNumber > 0) ||
            this.pmSpindash.inSpindashMode ||
            this.homingTarget
        ) {
            let maxBounceTargetDist = 4;
            if (this.homingTarget) maxBounceTargetDist = PlayerMovement.homingHeightOffset;
            const query: EntityQueryOptions = {
                location: this.playerLoc,
                maxDistance: maxBounceTargetDist,
            };
            const foundEntities = EntityUtil.getEntities(query, this.dimension);
            // smallestDist is how far away the current chosenTarget is, and the number potential targets are compared against
            // While chosenTarget == undefined, it's convenient to have smallestDist be an arbitrary very large number
            // This ensures that the first entity tested will always be selected as chosenTarget without needing any extra logic for the special condition
            let smallestDist = 9001;
            let chosenTarget: Entity | undefined = undefined;
            for (const entity of foundEntities) {
                if (!this.EntityIsGeneralTargetable(entity)) continue;

                const dist = V3.distance(this.playerLoc, entity.location);

                if (this.homingTarget && entity === this.homingTarget) {
                    smallestDist = dist;
                    if (this.homingList.length > 0) {
                        this.NextHomingTarget();
                        this.homingPauseTimer = GameData.CharDesignVars[this.charComponent!.currentCharacter!].multiHomingPause;
                        if (this.homingPauseTimer > 0) this.SetLeggingsDurability(0);
                    } else {
                        this.EndHoming();
                        this.DespawnHomingIndicator();
                    }
                    chosenTarget = entity;
                    break;
                } else if (dist < smallestDist) {
                    if (entity.id === "gm1_ord:eggman") {
                        if (this.badnikBounceBuffer === 0) {
                            this.badnikBounceBuffer = GameData.BadnikBounceBufferTicks;
                            chosenTarget = entity;
                            smallestDist = dist;
                        }
                    } else if (dist < PlayerMovement.BadnikHitRadius) {
                        if (this.badnikBounceBuffer === 0) {
                            this.badnikBounceBuffer = GameData.BadnikBounceBufferTicks;
                            chosenTarget = entity;
                            smallestDist = dist;
                        }
                    }
                }
            }
            if (chosenTarget && !GameData.NoBadnikDamageTypes.has(chosenTarget.typeId)) {
                let bounceDamage = GameData.BadnikBounceDamage;
                const targetId = chosenTarget.typeId;
                if (this.pmSpindash.inSpindashMode) {
                    bounceDamage =
                        GameData.CharDesignVars[this.charComponent!.currentCharacter!].abilityTiers[this.pmSpindash.spindashTier]
                            .bounceDamage;
                    if (this.pmSpindash.spindashTier === 4 && targetId === "gm1_ord:eggman")
                        MobComponentManager.getInstanceOfComponent(Eggman, chosenTarget).signalCriticalHit();
                }
                EntityUtil.applyDamage(chosenTarget, bounceDamage, {
                    damagingEntity: this.entity!,
                    cause: EntityDamageCause.entityAttack,
                });
                if (this.pmSpindash.inSpindashMode) {
                    let bounceKnockback = GameData.SpecialBadnikBounceSpindashKnockback.get(targetId);
                    if (!bounceKnockback) bounceKnockback = GameData.BadnikBounceSpindashKnockback;
                    this.verticalKnockback = bounceKnockback;
                    const knockback = this.horzontal_velocity.length();
                    const knockbackDir = this.horzontal_velocity.normalize();
                    this.entity!.applyKnockback(knockbackDir.x, knockbackDir.z, knockback, bounceKnockback);
                    this.pmSpindash.EndSpindash();
                } else {
                    const currentYVelocity = this.entity!.getVelocity().y;
                    let bounceKnockback = GameData.SpecialBadnikBounceKnockback.get(targetId);
                    if (!bounceKnockback) bounceKnockback = GameData.BadnikBounceKnockback;
                    if (currentYVelocity < 0) bounceKnockback += -currentYVelocity * GameData.BadnikBounceYVelocityMultiplier;
                    this.entity!.applyKnockback(0, 0, 0, bounceKnockback);
                    this.verticalKnockback = bounceKnockback;
                }
            }
        }
    }

    ProcessJumpAbilities() {
        if (!this.charComponent || !this.charComponent.currentCharacter) return;

        // Variable processing
        if (this.TrueOnGroundOrLiquid()) {
            this.jumpNumber = 0;
            this.numberOfTicksJumpHasBeenHeld = 0;
            this.jumpPressed = false;
            this.canTryHoming = true;
            this.pmBoost.groundedSinceFlight = true;
            // Turn off Glide and Hover when you touch the ground
            if (this.inHoverMode) {
                this.inHoverMode = false;
                this.hoverUsed = false;
                // This durability set can override the flight query, so we check for flight first
                if (!this.entity!.isFlying) this.SetLeggingsDurability(0);
            }
            if (this.inGlideMode) {
                this.inGlideMode = false;
                this.glideUsed = false;
                this.SetLeggingsDurability(0);
            }
            if (!this.landedSinceSneakAbility) {
                if (this.ticksSinceAbilityAir > GameData.GroundAfterAbilityBufferTicks) {
                    this.landedSinceSneakAbility = true;
                    this.ignoreSlowTicks = false;
                } else this.ticksSinceAbilityAir += 1;
            }
        } else if (!this.landedSinceSneakAbility) {
            this.ticksSinceAbilityAir += 1;
        }

        if (this.entity!.isJumping && !this.jumpPressed) {
            this.jumpPressed = true;
            this.jumpNumber += 1;
            this.numberOfTicksJumpHasBeenHeld = 0;
            if (this.GetLeggingsDurability() === 0) this.SetLeggingsDurability(9);
        } else if (!this.entity!.isJumping) {
            this.jumpPressed = false;
            if (this.GetLeggingsDurability() === 9) this.SetLeggingsDurability(0);
        }

        if (this.entity!.isJumping) {
            this.numberOfTicksJumpHasBeenHeld += 1;
        }

        const charVals = GameData.CharDesignVars[this.charComponent.currentCharacter];

        // Basic jump
        if (
            (this.wasOnGround || this.OnGroundOrLiquid()) &&
            this.jumpPressed &&
            this.numberOfTicksJumpHasBeenHeld == 1 &&
            this.jumpNumber === 1 &&
            (this.momentum > GameData.MinMomentum || this.pmLiquidRunning.isWaterRunning)
        ) {
            let dir = new V3(this.entity!.getViewDirection());
            dir.y = 0;
            dir = dir.normalize();
            const knockback = MathUtil.rangeMap(
                this.momentum,
                GameData.MinMomentum,
                GameData.MaxMomentumRange,
                GameData.JumpForwardKnockbackRange[0],
                GameData.JumpForwardKnockbackRange[1]
            );
            this.entity!.applyKnockback(dir.x, dir.z, knockback, charVals.jumpKnockback);
            if (this.pmLiquidRunning.isWaterRunning || this.pmLiquidRunning.isSnowRunning) {
                this.ResetRunningStates();
                this.pmLiquidRunning.liquidJumpLock = true;
                this.timeout(() => {
                    this.pmLiquidRunning.liquidJumpLock = false;
                    this.pmLiquidRunning.liquidRunningAllowed = true;
                }, GameData.LiquidJumpLockTicks);
            }
        }

        // Special jumps
        if (this.pmBoost.inBoostMode) {
            // We don't want any jump abilities to activate in Boost mode but we also can't just return because wasOnGround needs to be set
            this.wasOnGround = this.isOnGround || this.pmLiquidRunning.isWaterRunning || this.pmLiquidRunning.isSnowRunning;
        } else if (charVals.jumpAbility === JumpAbilityTypes.DoubleJump) {
            if (this.jumpPressed && this.numberOfTicksJumpHasBeenHeld == 1 && this.jumpNumber === 2) {
                // Calculate forward knockback to compensate for applyKnockback() killing your physics velocity
                let dir = new V3(this.entity!.getViewDirection());
                dir.y = 0;
                dir = dir.normalize();
                const velocityVector = new V3(this.entity!.getVelocity());
                const currentVVelocity = velocityVector.y;
                velocityVector.y = 0;
                const knockback = velocityVector.length() * charVals.doubleJumpForwardKnockbackMult;
                let verticalVelocityOffset = 0;
                if (currentVVelocity < 0) verticalVelocityOffset = -currentVVelocity * charVals.doubleJumpVKnockbackMult;
                this.entity!.applyKnockback(dir.x, dir.z, knockback, charVals.doubleJumpForceV + verticalVelocityOffset);
                // Handle the rest of of the double jump
                this.verticalKnockback = charVals.doubleJumpForceV;
                this.SetLeggingsDurability(4);
                this.timeout(() => {
                    // This durability set can override the flight query, so we check for flight first
                    if (!this.entity!.isFlying) this.SetLeggingsDurability(0);
                }, charVals.doubleJumpCommTicks);
            }
        } else if (charVals.jumpAbility === JumpAbilityTypes.Hover) {
            if (this.TrueOnGroundOrLiquid() || this.isSneaking) {
                if (this.inHoverMode) {
                    this.inHoverMode = false;
                    this.SetLeggingsDurability(0);
                }
                this.hoverUsed = false;
                return;
            }

            if (
                (!this.hoverUsed && this.jumpPressed && this.numberOfTicksJumpHasBeenHeld >= 10 && this.jumpNumber === 1) ||
                (this.jumpPressed && this.numberOfTicksJumpHasBeenHeld == 1 && this.jumpNumber === 2) ||
                (this.pmSpindash.inSpindashMode && !this.TrueOnGroundOrLiquid() && this.jumpNumber == 3) ||
                (this.hoverUsed && !this.TrueOnGroundOrLiquid() && this.jumpPressed && !this.inHoverMode)
            ) {
                this.inHoverMode = true;
                if (!this.hoverUsed) this.ticksSinceHoverStart = 0;
                else this.ticksSinceHoverStart = TicksPerSecond * charVals.hoverDuration;
                this.ticksInHoverCycle = 0;
                this.hoverUpCycle = true;
                this.hoverUsed = true;
                this.verticalKnockback = 0.0;
                if (this.momentum < charVals.hoverMomentumMin) this.momentum = charVals.hoverMomentumMin;
                this.pmSpindash.EndSpindash();
                this.SetLeggingsDurability(3);
            }

            if (this.inHoverMode) {
                if (!this.entity!.isJumping) {
                    this.inHoverMode = false;
                    // This durability set can override the flight query, so we check for flight first
                    if (!this.entity!.isFlying) this.SetLeggingsDurability(0);
                    return;
                }
                this.ticksSinceHoverStart += 1;
                if (this.ticksSinceHoverStart < TicksPerSecond * charVals.hoverDuration) {
                    this.ticksInHoverCycle += 1;
                    if (this.ticksInHoverCycle > charVals.hoverCycleTime * TicksPerSecond) {
                        this.hoverUpCycle = !this.hoverUpCycle;
                        this.ticksInHoverCycle = 0;
                    }

                    if (this.hoverUpCycle) {
                        this.verticalKnockback = charVals.hoverUpCycleKnockback;
                    } else {
                        this.verticalKnockback = charVals.hoverDownCycleKnockback;
                    }
                } else {
                    this.verticalKnockback = charVals.hoverFallKnockbackSpeed;
                }
                // Extra boost to elevation at start of hover
                if (this.ticksSinceHoverStart < charVals.hoverBoostTicks) this.verticalKnockback += charVals.hoverBoost;
            }
        } else if (charVals.jumpAbility === JumpAbilityTypes.Glide) {
            if (this.trueIsOnGround || this.isSneaking) {
                if (this.inGlideMode) {
                    this.inGlideMode = false;
                    this.SetLeggingsDurability(0);
                }
                this.glideUsed = false;
                return;
            }

            if (
                (!this.glideUsed && this.jumpPressed && this.numberOfTicksJumpHasBeenHeld >= 10 && this.jumpNumber === 1) ||
                (this.jumpPressed && this.numberOfTicksJumpHasBeenHeld == 1 && this.jumpNumber === 2) ||
                (this.pmSpindash.inSpindashMode && !this.trueIsOnGround && this.jumpNumber == 3) ||
                (this.glideUsed && !this.trueIsOnGround && this.jumpPressed && !this.inGlideMode)
            ) {
                this.inGlideMode = true;
                this.SetLeggingsDurability(6);
                this.glideUsed = true;
                this.verticalKnockback = 0.0;
                if (this.momentum < charVals.glideMomentumMin) this.momentum = charVals.glideMomentumMin;
            }

            if (this.inGlideMode) {
                if (!this.entity!.isJumping) {
                    this.inGlideMode = false;
                    this.SetLeggingsDurability(0);
                    return;
                }
                this.verticalKnockback = charVals.glideDownKnockback;
            }
        } else if (
            !this.trueIsOnGround &&
            !this.pmLiquidRunning.isWaterRunning &&
            !this.pmLiquidRunning.isSnowRunning &&
            this.canTryHoming &&
            this.charComponent &&
            !this.isSneaking &&
            charVals.jumpAbility === JumpAbilityTypes.Homing
        ) {
            // Find potential homing targets
            const potentialHomingTarget = this.HomingRay(charVals.homingRayRadius, charVals.homingRayRadius);

            let tpLoc: V3;
            if (potentialHomingTarget !== undefined) {
                try {
                    if (potentialHomingTarget.typeId === "minecraft:ender_dragon") {
                        tpLoc = new V3(potentialHomingTarget.location);
                        tpLoc.y += 1.0;
                    } else tpLoc = new V3(potentialHomingTarget.getHeadLocation());
                } catch (error) {
                    tpLoc = new V3(potentialHomingTarget.location);
                }
            }

            if (potentialHomingTarget !== undefined && this.homingIndicator === undefined) {
                this.homingIndicator = this.dimension.spawnEntity("gm1_ord:homing_indicator", tpLoc!);
                if (
                    potentialHomingTarget.typeId === "gm1_ord:eggman" ||
                    potentialHomingTarget.typeId === "minecraft:ender_dragon" ||
                    potentialHomingTarget.typeId === "minecraft:warden"
                ) {
                    this.homingIndicator.setProperty("gm1_ord:large_indicator", true);
                }
            } else if (potentialHomingTarget !== undefined && this.homingIndicator !== undefined) {
                this.homingIndicator.teleport(tpLoc!);
            } else if (potentialHomingTarget === undefined && this.homingIndicator !== undefined) {
                if (this.shouldInstantRemoveIndicator) {
                    this.homingIndicator.remove();
                } else {
                    this.DespawnHomingIndicator();
                    this.shouldInstantRemoveIndicator = true;
                }
                this.homingIndicator = undefined;
            }

            // Activate homing attack
            if (this.jumpPressed && this.numberOfTicksJumpHasBeenHeld == 1 && this.jumpNumber > 1) {
                if (potentialHomingTarget !== undefined) {
                    if (this.homingIndicator) {
                        this.homingIndicator.setProperty("gm1_ord:is_homing", true);
                    }

                    this.canTryHoming = false;
                    this.homingTarget = potentialHomingTarget;
                    this.homingTimer = 0;
                    this.homingVelocity = this.CalcTargetHomingVelocity();
                    this.shouldInstantRemoveIndicator = false;
                    this.SetLeggingsDurability(1);
                    this.entity!.runCommand("playsound homing_attack @a ~~~");
                    if (this.pmSpindash.inSpindashMode) {
                        this.pmSpindash.EndSpindash();
                    }
                }
                // No target, get a little boost
                else {
                    this.momentum += charVals.nonHomingPushMomentum;
                    this.canTryHoming = false;
                    this.entity!.runCommand("playsound homing_no_target @a ~~~");
                    let impulseDirection: V3 = new V3(this.entity!.getViewDirection());
                    impulseDirection.y = 0;
                    impulseDirection = impulseDirection.normalize();
                    this.entity!.applyKnockback(
                        impulseDirection.x,
                        impulseDirection.z,
                        charVals.nonHomingPushHKnockback,
                        charVals.nonHomingPushVKnockback
                    );
                    this.verticalKnockback += charVals.nonHomingPushVKnockback;
                }
            }
        } else if (charVals.jumpAbility === JumpAbilityTypes.MultiHoming) {
            if (!this.entity || this.homingTarget) return;

            // Flight & hovering
            if (this.jumpPressed && this.jumpNumber > 1) {
                if (this.pmSpindash.inSpindashMode) this.pmSpindash.EndSpindash();
                // Hover
                this.entity.applyKnockback(0, 0, 0, charVals.homingKnockbackAntiGravity);

                this.MultiHomingTargetTick(charVals.homingRayRadius, charVals.homingRayRadius);
            } else if (!this.jumpPressed && this.homingList.length > 0) this.ActivateMultiHoming();
        } else if (this.homingIndicator !== undefined) {
            if (this.shouldInstantRemoveIndicator) {
                this.homingIndicator.remove();
            } else {
                this.DespawnHomingIndicator();
                this.shouldInstantRemoveIndicator = true;
            }
            this.homingIndicator = undefined;
        }

        this.wasOnGround = this.isOnGround || this.pmLiquidRunning.isWaterRunning || this.pmLiquidRunning.isSnowRunning;
    }

    HomingRay(rayRange: number, rayRadius: number, checkHomingList: boolean = false): Entity | undefined {
        let potentialHomingTarget: undefined | Entity = undefined;
        const checksNeeded = Math.ceil(rayRange / rayRadius);
        const playerHeadLoc = this.entity!.getHeadLocation();
        const lookDir = new V3(this.entity!.getViewDirection()).normalize();
        for (let i = 0; i < checksNeeded; i++) {
            const checkLoc = lookDir.multiply((i + 1) * rayRadius).addV3(playerHeadLoc);
            const targets = this.dimension.getEntities({
                location: checkLoc,
                maxDistance: rayRadius,
            });
            let minDist = 9001;
            for (let n = 0; n < targets.length; n++) {
                const checkTarget = targets[n];
                if (!this.EntityIsHostileTargetable(checkTarget)) continue;

                if (checkHomingList && this.homingList.includes(checkTarget)) continue;

                const tameableComponent = checkTarget.getComponent(EntityIsTamedComponent.componentId) as EntityIsTamedComponent;
                if (tameableComponent) continue;

                let targetPos: V3;
                if (checkTarget.typeId === "minecraft:ender_dragon") targetPos = new V3(checkTarget.location);
                else targetPos = new V3(checkTarget.getHeadLocation());
                const checkDist = V3.distance(targetPos, playerHeadLoc);
                if (potentialHomingTarget !== undefined && checkDist >= minDist) continue;
                const rayDir = V3.subtract(playerHeadLoc, targetPos).normalize();
                const hasLineOfSight = this.dimension.getEntitiesFromRay(targetPos, rayDir, { type: "minecraft:player" }).length > 0;
                if (!hasLineOfSight) continue;

                potentialHomingTarget = checkTarget;
                minDist = checkDist;
            }
        }
        return potentialHomingTarget;
    }

    MultiHomingTargetTick(rayRange: number, rayRadius: number) {
        // Find Homing targets
        const potentialHomingTarget = this.HomingRay(rayRange, rayRadius, true);

        let tpLoc: V3;
        if (potentialHomingTarget !== undefined) {
            try {
                if (potentialHomingTarget.typeId === "minecraft:ender_dragon") {
                    tpLoc = new V3(potentialHomingTarget.location);
                    tpLoc.y += 1.0;
                } else tpLoc = new V3(potentialHomingTarget.getHeadLocation());
            } catch (error) {
                tpLoc = new V3(potentialHomingTarget.location);
            }
        }

        if (potentialHomingTarget && !this.homingList.includes(potentialHomingTarget)) {
            this.homingList.push(potentialHomingTarget);
            if (this.homingIndicators.length > 0)
                this.homingIndicators[this.homingIndicators.length - 1].setProperty("gm1_ord:in_queue", true);
            this.homingIndicators.push(this.dimension.spawnEntity("gm1_ord:homing_indicator", tpLoc!));
        }

        // Display Homing targets
        this.UpdateIndicatorListPositions();
    }

    ActivateMultiHoming() {
        // Activate Homing
        this.NextHomingTarget();
        this.homingVelocity = this.CalcTargetHomingVelocity();
        this.entity!.runCommand("playsound homing_attack @a ~~~");
        this.SetLeggingsDurability(1);
        // Slow falling is given when flight mode exits, and it seems to break knockback movement
        this.entity!.removeEffect("slow_falling");
    }

    NextHomingTarget() {
        this.homingTarget = this.homingList.pop();
        this.homingIndicator?.triggerEvent("gm1_ord:despawn_timer");

        // This loop is necessary to catch when an entity in the list has already died
        while (!EntityUtil.isValid(this.homingTarget)) {
            // Remove corresponding indicator to invalid entity
            this.homingIndicators.pop()?.triggerEvent("gm1_ord:despawn_timer");
            // Get next target
            this.homingTarget = this.homingList.pop();
            // Have we reached the end of the list?
            if (this.homingTarget === undefined) {
                this.ClearHomingList();
                return;
            }
        }

        this.homingTimer = 0;

        this.homingIndicator = this.homingIndicators.pop();
        if (!this.homingIndicator) return; // Type safety appeasement
        this.homingIndicator.setProperty("gm1_ord:is_homing", true);
        this.homingIndicator.setProperty("gm1_ord:in_queue", false);
    }

    EndHoming() {
        this.homingTarget = undefined;
        this.canTryHoming = true;
        this.landedSinceSneakAbility = true;
        this.ignoreSlowTicks = false;
        this.homingVelocity = V3.zero;
        this.homingPauseTimer = 0;
        this.SetLeggingsDurability(0);
        this.ClearHomingList();
    }

    ClearHomingList() {
        this.homingList = [];
        for (const indicator of this.homingIndicators) indicator.triggerEvent("gm1_ord:despawn_timer");
        this.DespawnHomingIndicator();
        this.homingIndicators = [];
    }

    UpdateIndicatorListPositions() {
        for (let i = this.homingList.length - 1; i >= 0; i--) {
            let tpLoc: V3;
            const iTarget = this.homingList[i];
            try {
                if (iTarget.typeId === "minecraft:ender_dragon") {
                    tpLoc = new V3(iTarget.location);
                    tpLoc.y += 1.0;
                } else tpLoc = new V3(iTarget.getHeadLocation());
                this.homingIndicators[i].teleport(tpLoc);
            } catch (error) {
                // This happens frequently when the entity dies, so we clean up
                this.homingList.splice(i, 1);
                this.homingIndicators[i].triggerEvent("gm1_ord:despawn_timer");
                this.homingIndicators.splice(i, 1);
            }
        }
    }

    DespawnHomingIndicator() {
        this.homingIndicator?.triggerEvent("gm1_ord:despawn_timer");
        this.homingIndicator = undefined;
    }
}
