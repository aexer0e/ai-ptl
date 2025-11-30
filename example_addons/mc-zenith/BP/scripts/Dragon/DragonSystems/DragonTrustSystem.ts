import { EntityMovementComponent, ItemStack, Player, world } from "@minecraft/server";
import DragonSystem from "./DragonSystem";

export default class DragonTrustSystem extends DragonSystem {
    trustIncreaseBuffer = new GenericBuffer<number, 40>(40, 0);
    trustLastTick = undefined as number | undefined;
    flightStateChangedTime = 0;
    flightStateCache = null as string | null;

    init() {
        this.comp.setProp("trust_increase", 0);

        this.syncSpeed();
        this.syncResistanceMobEffect();
    }

    process() {
        this.processTrustChange();
        this.processPassiveTrust();
    }

    processTrustChange() {
        const currentTrust = this.comp.getPersistentProperty("Trust");
        const trustChange = Math.max(0, currentTrust - (this.trustLastTick ?? currentTrust));
        this.trustIncreaseBuffer.push(trustChange);
        this.trustLastTick = currentTrust;
        const highestTrustIncrease = this.trustIncreaseBuffer.getBuffer().reduce((a, b) => Math.max(a, b), 0);
        const highestTrustIncreaseClamped = MathUtil.clamp(highestTrustIncrease, 0, 100);
        this.comp.setProp("trust_increase", highestTrustIncreaseClamped);
        // this.comp.log(`Trust increase: ${trustChange.toFixed(2)} (Highest: ${highestTrustIncreaseClamped.toFixed(2)})`);
    }

    processPassiveTrust() {
        const nearestPlayer = EntityUtil.getNearestPlayerAtDimLoc(this.comp.entityF);
        if (!nearestPlayer) return;

        const distanceToNearestPlayer = nearestPlayer.distanceTo(this.comp.entityF);
        const trust = this.comp.getPersistentProperty("Trust");
        const passiveTrustAddedInCurrentMilestone = this.comp.getPersistentProperty("PassiveTrustAddedInCurrentMilestone");
        const milestoneTrustCapacity = this.comp.milestone.trustRange[1] - this.comp.milestone.trustRange[0];
        const passiveTrustPct = MathUtil.clamp(passiveTrustAddedInCurrentMilestone / milestoneTrustCapacity, 0, 1);

        this.flightStateChangedTime =
            this.flightStateCache == this.comp.propCache.flight_state ? this.flightStateChangedTime : Main.currentTick;
        this.flightStateCache = this.comp.propCache.flight_state;
        const beingFlownTime = this.comp.timeSince(this.flightStateChangedTime);
        this.comp.log(`Flight state: ${this.comp.propCache.flight_state} (${beingFlownTime})`);

        const trustToAdd = this.comp.PassiveTrustGainPerTick({
            distanceToNearestPlayer,
            trust,
            passiveTrustPct,
            milestone: this.comp.milestone,
            isBeingFlown: this.comp.propCache.flight_state == "flying",
            isBeingFlownTime: this.comp.propCache.flight_state == "flying" ? this.comp.timeSince(this.flightStateChangedTime) : 0,
            hasPlayerTarget: this.comp.target instanceof Player,
        });
        if (trustToAdd) {
            this.addTrust(trustToAdd, true);
        }
        this.comp.log(`Trust: ${this.comp.getPersistentProperty("Trust").toFixed(2)}`);
        // this.comp.log(
        //     `Passive Trust Pct: ${passiveTrustPct.toFixed(2)} (${passiveTrustAddedInCurrentMilestone.toFixed(2)}/${milestoneTrustCapacity.toFixed(2)})`
        // );
    }

    addTrust(amount: number, isPassive = false, clampToMilestone = false) {
        const oldTrust = this.comp.getPersistentProperty("Trust");
        let newTrust = oldTrust + amount;
        const minTrust = clampToMilestone ? this.comp.milestone.trustRange[0] + 0.01 : this.comp.Milestones[0].trustRange[0];
        const maxTrust = clampToMilestone
            ? this.comp.milestone.trustRange[1] - 0.01
            : this.comp.Milestones[this.comp.Milestones.length - 1].trustRange[1];
        newTrust = MathUtil.clamp(newTrust, minTrust, maxTrust);
        // console.warn(`Min: ${minTrust}, Max: ${maxTrust}`, `Old: ${oldTrust}`, `New: ${newTrust}`);

        if (oldTrust === 0 && newTrust > 0) {
            this.comp.wantsSystem.fedTick = Main.currentTick;
        }

        if (isPassive) {
            const trustAdded = newTrust - oldTrust;
            const oldPassiveTrustAddedInCurrentMilestone = this.comp.getPersistentProperty("PassiveTrustAddedInCurrentMilestone");
            const newPassiveTrustAddedInCurrentMilestone = oldPassiveTrustAddedInCurrentMilestone + trustAdded;
            this.comp.setPersistentProperty("PassiveTrustAddedInCurrentMilestone", newPassiveTrustAddedInCurrentMilestone);
        }

        const oldMilestoneId = this.comp.milestone.id;
        this.comp.setPersistentProperty("Trust", newTrust);

        if (oldMilestoneId !== this.comp.milestone.id) {
            this.comp.entityF.triggerEvent(`gm1_zen:milestone_${oldMilestoneId}.remove`);
            this.comp.entityF.triggerEvent(`gm1_zen:milestone_${this.comp.milestone.id}.add`);

            const milestoneUpdateMsg = this.comp.MilestoneUpdateMessage(this.comp.milestone);
            if (milestoneUpdateMsg) world.sendMessage(milestoneUpdateMsg);

            if (this.comp.milestone.id >= this.comp.MilestoneToTriggerTameId && !this.comp.tameSystem.isTamed()) {
                const nearestPlayer = EntityUtil.getNearestPlayerAtDimLoc(this.comp.entityF);
                if (nearestPlayer) this.comp.tameSystem.tameTo(nearestPlayer);

                const loc = this.comp.entityF.location;
                const dragonTypeId = this.comp.entityF.typeId;
                const scaleId = GameData.scaleMap[dragonTypeId];
                if (scaleId) {
                    this.comp.entityF.dimension.spawnItem(new ItemStack(scaleId), loc);
                }
            }

            if (this.comp.milestone.wantToTrigger) {
                this.comp.wantsSystem.setWant(this.comp.milestone.wantToTrigger);
            }

            this.comp.setPersistentProperty("PassiveTrustAddedInCurrentMilestone", 0);

            this.syncSpeed();
            this.syncResistanceMobEffect();
        }

        this.comp.setProp("milestone", this.comp.milestone.id);
    }

    syncSpeed() {
        const movementComponent = this.comp.entityF.getComponent(EntityMovementComponent.componentId) as EntityMovementComponent;
        const isImmobile = this.comp.propCache.rest_state != "none";

        if (isImmobile) {
            // console.warn("Immobile state detected, setting speed to 0.");
            return movementComponent.setCurrentValue(0);
        }

        const isFlyingOnOwn = this.comp.propCache.is_flying_on_own;
        if (isFlyingOnOwn) {
            // console.warn("Flying on own detected, setting speed to 0.03.");
            return movementComponent.setCurrentValue(0.03);
        }

        const speedToSet = this.comp.milestone.speed;
        // console.warn(`Setting speed to ${speedToSet}.`);
        movementComponent.setCurrentValue(speedToSet);
    }

    syncResistanceMobEffect() {
        const resistanceToSet = this.comp.milestone.resistanceMobEffect;
        const currentResistance = this.comp.entityF.getEffect("resistance");
        // console.warn(`Current resistance: ${currentResistance?.amplifier}, Setting resistance to: ${resistanceToSet}`);
        if (currentResistance?.amplifier != resistanceToSet) {
            this.comp.entityF.removeEffect("resistance");
            // eslint-disable-next-line minecraft-linting/avoid-unnecessary-command
            this.comp.entityF.runCommand(`effect @s resistance infinite ${resistanceToSet} true`);
        }
    }
}
