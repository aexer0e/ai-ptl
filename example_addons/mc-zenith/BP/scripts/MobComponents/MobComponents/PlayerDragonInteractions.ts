import { Entity, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import DragonPersistentData from "Dragon/DragonPersistentData";
import { Message } from "Types/Message";
import V3 from "Wrappers/V3";
import Dragon from "./Dragons/Dragon";
import { MobComponentPlayer } from "./MobComponent";

type TrustChangeIndicator = {
    value: string;
};

export default class extends MobComponentPlayer {
    isHoldingWeaponTagCache: boolean | null = null;
    lastLookedAtDragonTick = 0;
    respawnCoolDownTime = 20 * 10;
    prevTrustLevel = 0;
    prevDragon: Entity;
    originalMilestoneName: string;

    hitDrgaonsTimeTable: Map<string, number> = new Map(); // id => tick

    constructor(entity: Entity) {
        super(entity, 1);

        this.onWorldEvent("WorldAfterEvents", "itemUse", (eventData) => {
            if (eventData.source.id !== this.entityId) return;
            if (!this.entity.valid()) return;

            if (eventData.itemStack.typeId == "gm1_zen:dragon_horn") {
                const form = new ActionFormData().title({ translate: "gm1_zen.horn.title1" });
                const dragonsOwned = DragonPersistentData.getOwnedDragons(this.entityId);
                if (!dragonsOwned.length) {
                    form.body({ translate: "gm1_zen.horn.no_tamed_dragon" });
                    form.button({ translate: "gm1_zen.horn.no_tamed_dragon_OK" });
                    return form.show(this.entity);
                }
                for (const dragon of dragonsOwned) {
                    const dragonName = dragon.nameTag.length ? { text: dragon.nameTag } : { translate: `entity.${dragon.typeId}.name` };
                    let iconPath: string;
                    switch (dragon.typeId) {
                        case "gm1_zen:nightfury": {
                            iconPath = "textures/gm1/zen/ui/strike_class";
                            break;
                        }
                        case "gm1_zen:gronckle": {
                            iconPath = "textures/gm1/zen/ui/boulder_class";
                            break;
                        }
                        case "gm1_zen:deadlynadder": {
                            iconPath = "textures/gm1/zen/ui/sharp_class";
                            break;
                        }
                        case "gm1_zen:monstrousnightmare": {
                            iconPath = "textures/gm1/zen/ui/stoker_class";
                            break;
                        }
                        case "gm1_zen:hideouszippleback": {
                            iconPath = "textures/gm1/zen/ui/mystery_class";
                            break;
                        }
                        default: {
                            iconPath = "textures/gm1/zen/ui/hornIconPlaceholder";
                            break;
                        }
                    }

                    form.button(dragonName, iconPath);
                }
                form.show(this.entity).then((response) => {
                    if (response.selection === undefined) return;
                    const selectedDragon = dragonsOwned[response.selection];
                    const form = new ActionFormData().title({ translate: "gm1_zen.horn.title2" });

                    const deathTick = selectedDragon.deathTick;
                    const isDragonDie = deathTick !== undefined;
                    let isInCooldown = false;

                    if (isDragonDie) {
                        const remainCoolDownTime = this.respawnCoolDownTime - (system.currentTick - deathTick);
                        isInCooldown = remainCoolDownTime > 0;
                    }

                    if (isDragonDie && isInCooldown) {
                        form.button({ translate: "gm1_zen.horn.button.summon_dragon_forbid" });
                    } else {
                        form.button({ translate: "gm1_zen.horn.button.summon_dragon" });
                    }
                    form.button({ translate: "gm1_zen.horn.button.release_dragon1" });
                    form.show(this.entityF).then((response) => {
                        if (response.selection === 0) {
                            if (isInCooldown) {
                                this.entityF.sendMessage({ translate: "gm1_zen.horn.dragon_in_cooldown_time" });
                            } else {
                                DragonPersistentData.summonDragon(selectedDragon.id, this.entityF);
                            }
                        } else if (response.selection === 1) {
                            const form = new ActionFormData().title({ translate: "gm1_zen.horn.title3" });
                            form.body({ translate: "gm1_zen.horn.release_warning" });
                            form.button({ translate: "gm1_zen.horn.button.release_dragon2" });
                            form.button({ translate: "gm1_zen.horn.button.release_cancle" });
                            form.show(this.entityF).then((response) => {
                                if (response.selection === 0) {
                                    DragonPersistentData.removePersistentData(selectedDragon.id);
                                    const entity = EntityUtil.getEntityById(selectedDragon.entityId);
                                    if (entity) entity.remove();
                                }
                            });
                        }
                    });
                });
            }
        });

        this.onWorldEvent("WorldAfterEvents", "entityHitEntity", (eventData) => {
            if (eventData.damagingEntity.id !== this.entityId) return;
            if (!this.entity.valid()) return;

            // if (eventData.hitEntity.typeId.startsWith("gm1_zen:")) {
            if (GameData.DragonTypeIds.has(eventData.hitEntity.typeId)) {
                this.hitDrgaonsTimeTable.set(eventData.hitEntity.id, Main.currentTick);
            }
        });
    }

    hasHitDragonInLastTicks(dragonId: string, ticks: number) {
        if (this.hitDrgaonsTimeTable.has(dragonId)) {
            const hitTick = this.hitDrgaonsTimeTable.get(dragonId)!;
            return Main.currentTick - hitTick <= ticks;
        }
        return false;
    }

    process() {
        if (!this.entity.valid()) return;

        this.setIsHoldingWeaponTag(this.isHoldingWeapon());

        if (Config.get("Debug: Dragon Actionbar")) {
            const nearbyDragons = EntityUtil.getEntitiesAtDimLoc(
                { families: ["gm1_zen:dragon"], maxDistance: 10, closest: 10 },
                this.entityF
            );
            for (const dragon of nearbyDragons) {
                const mobComponent = dragon.getDragonMobComponent();
                if (!mobComponent) continue;

                if (mobComponent.rider?.id === this.entityId) return this.handleLookingAtDragon(mobComponent);
                const isOnScreen = V3.isLocationInViewDirection(
                    this.entity.getHeadLocation(),
                    this.entity.getViewDirection(),
                    dragon.location,
                    0.8
                );
                if (isOnScreen) return this.handleLookingAtDragon(mobComponent);
            }
        }

        const nearestDragon = EntityUtil.getEntitiesAtDimLoc({ closest: 1, families: ["gm1_zen:dragon"] }, this.entity)[0];
        if (nearestDragon) this.handleNearestDragon(nearestDragon);

        if ((this, this.timeSince(this.lastLookedAtDragonTick) == 2)) {
            this.entityF.onScreenDisplay.setActionBar(" ");
        }
    }

    handleLookingAtDragon(mobComponent: Dragon) {
        const msg = this.getDragonInfoActionbarMessage(mobComponent);
        this.entityF.onScreenDisplay.setActionBar(msg);
        this.lastLookedAtDragonTick = Main.currentTick;
    }

    /**
     * This method handles what should show up on the action bar, such as stamina level, dragon name,
     * trust level, and if trust is gained or lost.
     * @param dragonData The dragon the action bar will show info for
     * @returns a string to be displayed on the action bar
     */
    getDragonInfoActionbarMessage(dragonData: Dragon): Message {
        const trustGained: TrustChangeIndicator = {
            value: dragonData.ActionbarData.trustPulse.trustGainedIcon,
        };
        const trustLost: TrustChangeIndicator = {
            value: dragonData.ActionbarData.trustPulse.trustLostIcon,
        };
        const dragonEntity = dragonData.entityF;

        const currTrust = dragonData.getPersistentProperty("Trust");
        const sameDragon = dragonEntity == this.prevDragon;

        if (currTrust > this.prevTrustLevel && sameDragon) {
            this.tempChangeMilestoneName(trustGained, dragonData.ActionbarData.trustPulse.pulseLength, dragonData);
        } else if (currTrust < this.prevTrustLevel && sameDragon) {
            this.tempChangeMilestoneName(trustLost, dragonData.ActionbarData.trustPulse.pulseLength, dragonData);
        }
        const milestoneString = `${dragonData.milestone.name} ${dragonData.milestone.id}`;
        this.prevTrustLevel = currTrust;
        this.prevDragon = dragonData.entityF;

        const isSaddled = dragonData.entityF.getProperty("gm1_zen:is_saddled") as boolean;
        const speciesName = { translate: `entity.${dragonEntity.typeId}.name` };

        //if the dragon is unsaddled and isn't being ridden
        if (!isSaddled || (dragonEntity.nameTag.length == 0 && dragonData.flightSystem.getRider() == undefined)) {
            return [speciesName, "   ", milestoneString];
        }
        let stamina = "";
        if (dragonData.tameSystem.isTamed() && dragonData.flightSystem.getRider() != undefined) {
            if (dragonData.milestone.maxStamina != "infinite" && dragonData.flightSystem.stamina != "infinite") {
                stamina = `${this.getStaminaBarString(dragonData)}`;
                const returnMessage = this.centerMessage(milestoneString, stamina);
                return returnMessage;
            }
        }
        return [milestoneString];
    }

    /**This method centers the Milestone status on the action bar. It is meant to only have the milestone level and no name.
     * @param topLine is the top part of the message, in this case the milestone level
     * @param bottomLine is the bottom part of the message, in this case the  stamina bar.
     * @remarks This was a tricky one because of the color codes on each character being counted as a character as well, this is why you see magic numbers like 4,
     * which removes the color code characters from counting. This is the same for the magic number 3, as there are 3 characters per "blip" on the stamina bar.
     * There are some weird quirks with milestone 3 and 10, hence the reason for the if else block. It is impossible to fully center the top line at times,
     * due to an even number of blips on the stamina bar.
     */
    private centerMessage(topLine: string, bottomLine: string): string[] {
        if (topLine.length == bottomLine.length) return [topLine, bottomLine];

        const realTopLine = topLine.length - 4;
        const diff = bottomLine.length / 3 - realTopLine;
        let padding = "";
        let paddingLength = diff / 2;
        //return if milestone 3, no need to center
        if (diff == 1) return [topLine, "\n", bottomLine];

        if (diff < 16) {
            for (let i = 0; i < paddingLength; i++) {
                padding += " ";
            }
        } else {
            paddingLength++;
            for (let i = 0; i < paddingLength; i++) {
                padding += " ";
            }
        }

        topLine = padding + topLine;
        bottomLine = "\n" + bottomLine;
        return [topLine, bottomLine];
    }

    /**
     * This function temporarily changes a milestone name for a few seconds
     * @param character what to change the milestone name to
     * @param seconds how many seconds to change the milestone name for
     * @param dragonData which dragon to do this change to
     **/
    private tempChangeMilestoneName(character: TrustChangeIndicator, seconds: number, dragonData: Dragon) {
        if (dragonData.milestone.id == 10) return;
        if (dragonData.milestone.name != character.value) {
            this.originalMilestoneName = dragonData.milestone.name;
        }

        dragonData.milestone.name = character.value;

        system.runTimeout(() => {
            dragonData.milestone.name = this.originalMilestoneName;
        }, seconds * 20);
    }

    getStaminaBarString(dragonData: Dragon): string | void {
        const stamina = dragonData.flightSystem.stamina;
        const maxStamina = dragonData.milestone.maxStamina;

        if (stamina === "infinite" || maxStamina === "infinite") return;

        const data = dragonData.ActionbarData.stamina;
        const barCharacter = data.barCharacter;
        const amountPerBar = data.amountPerBar;
        const remainingColor = data.remainingColor;
        const remainingColorBoosting = data.remainingColorBoosting;
        const lostColor = data.lostColor;

        if (amountPerBar <= 0) return;

        // Determine total segments and ensure at least one segment for any positive stamina
        const totalBars = Math.floor(maxStamina / amountPerBar);
        let filledBars = 0;
        if (stamina > 0) {
            // Ceil ensures any positive stamina shows at least one bar
            filledBars = Math.min(totalBars, Math.ceil(stamina / amountPerBar));
        }

        const isBoosting = dragonData.flightSystem.isBoosting;

        let bar = "";
        for (let i = 1; i <= totalBars; i++) {
            if (i <= filledBars) {
                bar += (isBoosting ? remainingColorBoosting : remainingColor) + barCharacter;
            } else {
                bar += lostColor + barCharacter;
            }
        }
        return bar;
    }

    handleNearestDragon(dragon: Entity) {
        if (Config.get("Debug: Nearest Dragon Data in Actionbar")) {
            this.logNearestDragonData(dragon);
        }
    }

    logNearestDragonData(dragon: Entity) {
        const mobComponent = dragon.getDragonMobComponent();
        if (!mobComponent) return;

        const logData = mobComponent.logData;
        const distance = this.entityF.distanceTo(dragon);
        let logString = "Distance: " + Math.round(distance) + "m";
        let currentLineLength = logString.length;
        for (const line of logData) {
            if (currentLineLength + line.length > 6) {
                logString += "\n" + line;
                currentLineLength = line.length;
            } else {
                if (logString.length > 0) logString += " | ";
                logString += line;
                currentLineLength += line.length + 3; // 3 for the " | "
            }
        }

        this.entityF.onScreenDisplay.setActionBar(logString);
    }

    pacifyDragonsToSelf() {
        const nearbyDragons = EntityUtil.getEntitiesAtDimLoc({ families: ["gm1_zen:dragon"], maxDistance: 10, closest: 10 }, this.entityF);
        for (const dragon of nearbyDragons) {
            const mobComponent = dragon.getDragonMobComponent();
            if (!mobComponent) continue;

            if (this.hasHitDragonInLastTicks(dragon.id, 10 * 20)) continue; // If the player has hit a dragon in the last 5 seconds, don't pacify

            if (mobComponent.target?.id === this.entityId) {
                dragon.triggerEvent("gm1_zen:reset_target");
                EntityStore.temporary.set(dragon, "Target", null);
            }
        }
    }

    setIsHoldingWeaponTag(isHoldingWeapon: boolean) {
        if (this.isHoldingWeaponTagCache === isHoldingWeapon) return;
        this.isHoldingWeaponTagCache = isHoldingWeapon;
        if (isHoldingWeapon) this.entityF.addTag("gm1_zen:is_holding_weapon");
        else this.entityF.removeTag("gm1_zen:is_holding_weapon");

        if (!isHoldingWeapon) {
            this.pacifyDragonsToSelf();
        }
    }

    isHoldingWeapon() {
        const selectedItem = InventoryUtil.selectedItem(this.entityF);
        if (!selectedItem) return false;
        if (selectedItem.hasTag("minecraft:is_sword")) return true;
        if (selectedItem.hasTag("minecraft:is_axe")) return true;
        if (selectedItem.hasTag("minecraft:is_pickaxe")) return true;
        if (GameData.WeaponItemTypeIds.includes(selectedItem?.typeId)) {
            return true;
        }
        return false;
    }
}
