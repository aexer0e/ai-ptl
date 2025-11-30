import { EntityHealthComponent, ItemStack, Player, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import DragonPersistentData from "Dragon/DragonPersistentData";
import { FoodDataEntry } from "Game/GameData";
import { WantsData, WantsEntryData } from "MobComponents/MobComponents/Dragons/Dragon";
import V3 from "Wrappers/V3";
import DragonSystem from "./DragonSystem";

export default class DragonWantsSystem extends DragonSystem {
    currentWant?: {
        key: keyof WantsData;
        data: WantsEntryData;
        startTimestamp: number;
    };

    sleepTimer?: number;
    wakeUpTimer?: number;

    wantsIntervalCache = {} as Record<keyof WantsData, number>;

    immobileTime = 0;

    //debugging variables to track average scratch time
    scratchLog = [0];
    scratchTime = 0;
    totalTime = 0;

    fedTick = 0;

    init() {
        this.setWantsIntervalCache();
        this.comp.setProp("want", "none");
        this.comp.propCache.rest_state = this.comp.entityF.getProperty("gm1_zen:rest_state") as
            | "none"
            | "sitting"
            | "sleeping"
            | "scratching";
        if (this.comp.propCache.rest_state == "sleeping") {
            this.wakeUpIn(this.comp.SleepDurationRange[0]);
        } else if (this.comp.propCache.rest_state == "sitting") {
            this.sleepIn(this.comp.SitToSleepDuration);
        }
    }

    processWants() {
        const velocity = this.comp.entityF.getVelocity();
        const isMoving = new V3(velocity).length() > 0.02;
        this.immobileTime = isMoving ? 0 : this.immobileTime + 1;

        this.comp.log(`Want state: ${this.currentWant?.key}`);
        this.comp.log(`Rest state: ${this.comp.propCache.rest_state}`);

        // if standing still for a while, tp items to itself incase its stuck trying to pick them up
        if (this.immobileTime > 40 && this.comp.isCurrentTickNth(12)) {
            const itemsNearby = EntityUtil.getEntitiesAtDimLoc({ type: "minecraft:item", maxDistance: 4.2 }, this.comp.entityF);
            for (const item of itemsNearby) {
                const isFood = this.comp.FoodData[item.typeId];
                if (!isFood) continue;
                const itemLoc = item.location;
                const distance = new V3(this.comp.entityF.location).distanceTo(itemLoc);
                if (distance > 4) continue;
                item.teleport(this.comp.entityF.location);
            }
        }

        const shouldBeUnsat = this.comp.propCache.rest_state == "sitting" && (this.comp.isAttacked() || this.comp.isAfraidMobNearby());
        if (shouldBeUnsat) {
            this.comp.setProp("rest_state", "none");
            this.comp.entityF.triggerEvent("gm1_zen:unsit");
            this.comp.trustSystem.syncSpeed();
            return;
        }
        if (this.comp.propCache.rest_state === "sitting") {
            this.tryScratching();
        }
        //if dragon is sleeping or sitting, exit function before setting a want
        if (this.comp.propCache.rest_state == "sleeping" || this.comp.propCache.rest_state == "sitting") return;
        if (this.comp.rider) return;
        if (this.currentWant?.data.priority == "manual") {
            if (this.comp.timeSince(this.currentWant.startTimestamp) >= this.currentWant.data.duration) {
                this.removeWant();
            }
            return;
        }
        // select a want
        for (const key in this.comp.Wants) {
            const wantKey = key as keyof WantsData;
            const want = this.comp.Wants[wantKey];

            if (want.priority == "manual") continue; // manual wants are not auto triggered

            if (this.comp.milestone.id < want.minimumMilestoneId) continue;
            if (this.currentWant) {
                if (this.currentWant.key === wantKey) continue;
                if (this.currentWant.data.priority < want.priority) continue;
            }
            if (this.comp.isCurrentTickNth(this.wantsIntervalCache[wantKey])) {
                this.setWant(wantKey);
                break;
            }
        }

        // stop the current want if the duration is over
        if (this.currentWant) {
            this.comp.log(
                `Current want: ${this.currentWant.key} (Time left: ${((this.currentWant.data.duration - this.comp.timeSince(this.currentWant.startTimestamp)) / 20).toFixed(2)}s)`
            );
            if (this.comp.timeSince(this.currentWant.startTimestamp) >= this.currentWant.data.duration) {
                this.removeWant();
            }
        }
    }

    setWant(key: keyof WantsData) {
        this.comp.setProp("want", key);

        this.currentWant = {
            key,
            data: this.comp.Wants[key],
            startTimestamp: Main.currentTick,
        };
        this.setWantsIntervalCache();
    }

    finishWant(fedFavoriteFood = false) {
        if (!this.currentWant) return;

        if (fedFavoriteFood) {
            this.comp.setProp("want", "hungry_success_favorite");
            this.comp.timeout(() => this.comp.setProp("want", "none", ["hungry_success_favorite"]), 5);
        } else {
            const currentWantKey = this.currentWant.key;
            this.comp.setProp("want", `${currentWantKey}_success`);
            this.comp.timeout(() => this.comp.setProp("want", "none", [`${currentWantKey}_success`]), 5);
        }

        this.currentWant = undefined;
        this.setWantsIntervalCache();
    }

    removeWant() {
        this.comp.setProp("want", "none");

        if (typeof this.sleepTimer == "number") system.clearRun(this.sleepTimer);
        if (typeof this.wakeUpTimer == "number") system.clearRun(this.wakeUpTimer);

        this.currentWant = undefined;
        this.setWantsIntervalCache();
    }

    setWantsIntervalCache() {
        for (const key in this.comp.Wants) {
            const wantKey = key as keyof WantsData;
            const want = this.comp.Wants[wantKey];
            if (want.priority == "manual") continue;
            this.wantsIntervalCache[wantKey] = MathUtil.randomInt(want.interval[0], want.interval[1]) + want.duration;
        }
    }

    onInteractedWithFood(player: Player, selectedItem: ItemStack, foodData: FoodDataEntry) {
        const healthIncreaseAmount = this.addHealth(foodData.healthRegeneration);

        selectedItem.amount = 1;
        const isFavoriteFood = this.comp.FavoriteFood.includes(selectedItem.typeId);

        if (this.currentWant?.key == "hungry") {
            InventoryUtil.clearItem(player, selectedItem);
            this.finishWant(isFavoriteFood);
            let trustToAdd = this.comp.TrustGainActions.FeedWhenHungry;
            if (isFavoriteFood) trustToAdd += this.comp.TrustGainActions.FeedFavouriteFoodBonus;
            this.comp.trustSystem.addTrust(trustToAdd);
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Feeding ${this.comp.entityF.nameTag} ${selectedItem.typeId} (${foodData.healthRegeneration}) because of hunger`
            );
        } else if (this.comp.milestone.id < this.comp.MilestoneToTriggerTameId) {
            InventoryUtil.clearItem(player, selectedItem);
            let trustToAdd = this.comp.TrustGainActions.FeedWhenWild;
            if (isFavoriteFood) trustToAdd += this.comp.TrustGainActions.FeedFavouriteFoodBonus;
            this.comp.trustSystem.addTrust(trustToAdd);
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Feeding ${this.comp.entityF.nameTag} ${selectedItem.typeId} (${foodData.healthRegeneration}) because it is wild`
            );
        } else if (healthIncreaseAmount > 0) {
            InventoryUtil.clearItem(player, selectedItem);
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Feeding ${this.comp.entityF.nameTag} ${selectedItem.typeId} (${foodData.healthRegeneration}) because it will heal`
            );
        } else {
            BroadcastUtil.debugSystem(
                "DragonInteractions",
                `Failed to feed ${this.comp.entityF.nameTag} ${selectedItem.typeId} (${foodData.healthRegeneration})`
            );
        }
    }

    toggleSitting() {
        const isSitting = this.comp.propCache.rest_state != "none";
        if (isSitting) {
            this.comp.entityF.triggerEvent("gm1_zen:unsit");
            if (this.comp.propCache.rest_state == "sleeping") this.wakeUp("none");
            this.comp.setProp("rest_state", "none");
        } else {
            if (this.comp.isAttacked() || this.comp.isAfraidMobNearby()) {
                // console.warn("Cannot sit while attacked or afraid.");
                return;
            }
            this.comp.entityF.triggerEvent("gm1_zen:sit");
            this.sleepIn(this.comp.SitToSleepDuration);
            this.comp.setProp("rest_state", "sitting");
        }
        this.comp.trustSystem.syncSpeed();
    }

    onInteractedWithWhilePlayful() {
        this.comp.trustSystem.addTrust(this.comp.TrustGainActions.PetWhenPlayful);
        this.finishWant();
    }

    sleepIn(duration: number) {
        if (this.sleepTimer !== undefined) {
            system.clearRun(this.sleepTimer);
        }
        this.sleepTimer = this.comp.timeout(() => {
            this.sleep();
            this.sleepTimer = undefined;
        }, duration);
    }

    sleep() {
        this.comp.setProp("rest_state", "sleeping", ["sitting", "scratching"]);

        this.removeWant();

        const wakeUpInDuration = MathUtil.random(this.comp.SleepDurationRange[0], this.comp.SleepDurationRange[1]);
        this.wakeUpIn(wakeUpInDuration);
    }

    wakeUpIn(duration: number) {
        if (this.wakeUpTimer !== undefined) {
            system.clearRun(this.wakeUpTimer);
        }
        this.wakeUpTimer = this.comp.timeout(() => {
            this.wakeUp("sitting");
            this.wakeUpTimer = undefined;
        }, duration);
    }

    wakeUp(nextState: "sitting" | "none") {
        this.comp.setProp("rest_state", nextState, ["sleeping"]);

        this.sleepIn(this.comp.SitToSleepDuration);
    }

    addHealth(amount: number): number {
        const healthComponent = this.comp.entityF.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
        const maxHealth = healthComponent.effectiveMax;
        const oldHealth = healthComponent.currentValue;
        const newHealth = Math.min(oldHealth + amount, maxHealth);
        healthComponent.setCurrentValue(newHealth);

        const healthIncreaseAmount = newHealth - oldHealth;
        return healthIncreaseAmount;
    }

    promptToName(player: Player) {
        const form = new ModalFormData()
            .title({ translate: "gm1_zen.message.tame_prompt.title" })
            .textField("gm1_zen.message.tame_prompt.text", this.comp.entityF.nameTag);
        form.show(player).then((response) => {
            const newName = response.formValues?.[0] as string;
            if (newName && newName != "") {
                this.comp.entityF.nameTag = newName!.toString();
                DragonPersistentData.updatePersistentData(this.comp.entityId, { nameTag: newName });
            }
        });
    }

    tryScratching() {
        if (Main.currentTick % this.comp.ScratchInterval !== 0) return; // trigger every scratchInterval

        /**uncomment the following code to work out out average scratch time */
        // console.log("----------------------------------");
        // console.log("scratch attempt triggered");

        if (MathUtil.chance(this.comp.DragonScratchChance)) {
            this.comp.setProp("rest_state", "scratching", ["sitting"]); // scratching only when sitting
            const scratchAnimationTime = 20 * 3;

            // delay drop scale to match animation
            this.comp.timeout(() => this.tryDropScale(), 20 * 2);

            this.comp.timeout(() => {
                this.comp.setProp("rest_state", "sitting", ["scratching"]); // return to sitting only if still scratching
            }, scratchAnimationTime);

            /**uncomment the following code to workout out average scratch time */
            // const lastScratchTime = (Main.currentTick - this.scratchTime) / 20;
            // console.log(`Time since last Scratch: ${lastScratchTime} seconds`);
            // if (lastScratchTime < 800) {
            //     this.totalTime += (Main.currentTick - this.scratchTime) / 20;
            //     if (this.scratchLog.at(0) === 0) {
            //         this.scratchLog.splice(0, 1);
            //     }
            // }

            // this.scratchLog.push(Main.currentTick);
            // this.scratchTime = Main.currentTick;
            // const avgScratchTime = this.totalTime / this.scratchLog.length;
            // console.log(`average time between scratches: ${avgScratchTime} seconds`);
        }
    }

    private tryDropScale() {
        if (MathUtil.chance(this.comp.DragonScaleDropChance)) {
            const loc = this.comp.entityF.location;
            const [min, max] = this.comp.DragonScaleDropAmountRange;
            const amount = MathUtil.randomInt(min, max);
            try {
                const dragonTypeId = this.comp.entityF.typeId;
                const scaleId = GameData.scaleMap[dragonTypeId];
                if (scaleId) {
                    for (let i = 0; i < amount; i++) {
                        this.comp.entityF.dimension.spawnItem(new ItemStack(scaleId), loc);
                    }
                }
                return;
            } catch {}
        }
        return;
    }
}
