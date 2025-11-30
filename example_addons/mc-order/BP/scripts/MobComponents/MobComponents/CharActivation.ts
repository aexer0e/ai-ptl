import {
    Dimension,
    EnchantmentTypes,
    Entity,
    EntityEquippableComponent,
    EntityRideableComponent,
    EquipmentSlot,
    GameMode,
    ItemDurabilityComponent,
    ItemEnchantableComponent,
    ItemLockMode,
    ItemStack,
    Player,
    TicksPerSecond,
    Vector3,
    system,
} from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import PlayerMovement from "MobComponents/MobComponents/PlayerMovement";
import BlockUtil from "Utilities/BlockUtil";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EntityUtil from "Utilities/EntityUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import Runner from "Utilities/Runner";
import V3 from "Wrappers/V3";
import MobComponent from "./MobComponent";

export default class CharActivation extends MobComponent {
    static readonly EntityTypes = ["minecraft:player"];

    player: Player;

    inWaterTicks: number = 0;
    inWater: boolean = false;
    dummy_rider1: Entity | null = null;
    dummy_rider2: Entity | null = null;

    previousItem: string | undefined = undefined;
    currentCharacter: string | undefined = undefined;
    previousCharacter: string | undefined = undefined;
    justTransformed: number = 0;
    transformLock: boolean = false;
    itemInUse: boolean = false;

    static readonly CHARACTER_TOKENS = new Map<string, number>([
        ["gm1_ord:sonic_life", 0],
        ["gm1_ord:tails_life", 1],
        ["gm1_ord:knuckles_life", 2],
        ["gm1_ord:amy_life", 3],
        ["gm1_ord:shadow_life", 4],
        ["gm1_ord:super_sonic_life", 5],
        ["gm1_ord:super_shadow_life", 6],
    ]);
    static readonly CHARACTER_HELMETS = new Set<string>([
        "gm1_ord:transform_helmet_sonic",
        "gm1_ord:transform_helmet_tails",
        "gm1_ord:transform_helmet_knuckles",
        "gm1_ord:transform_helmet_amy",
        "gm1_ord:transform_helmet_shadow",
        "gm1_ord:transform_helmet_super_sonic",
        "gm1_ord:transform_helmet_super_shadow",
    ]);
    static readonly CHARACTER_ARMOR = new Set<string>([
        "gm1_ord:transform_chestplate",
        "gm1_ord:transform_leggings",
        "gm1_ord:transform_boots",
    ]);
    static readonly SUPER_TOKENS = new Map<string, string>([
        ["gm1_ord:super_sonic_life", "gm1_ord:sonic_life"],
        ["gm1_ord:super_shadow_life", "gm1_ord:shadow_life"],
    ]);
    static readonly SUPER_NAMES = new Map<string, string>([
        ["gm1_ord:super_sonic_life", "Super Sonic"],
        ["gm1_ord:super_shadow_life", "Super Shadow"],
    ]);

    readonly Transfer_Parameter = {
        freeTime: 5,
        consumeRate: 2,
    };
    private freeTimeInterval: number | undefined;
    private ringConsumptionInterval: number | undefined;
    private isConsumingRings = false;

    isWearingArmor(): boolean {
        const equipment = InventoryUtil.getEquipment(this.player);

        if (!equipment) return false;

        const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
        for (let i = 0; i < slots.length; i++) {
            const slotTypeId = equipment.getEquipment(slots[i])?.typeId;
            // We don't check for transform helmets because they are used during transformation to communicate with the attachable.
            if (
                slotTypeId !== undefined &&
                !CharActivation.CHARACTER_HELMETS.has(slotTypeId) &&
                !CharActivation.CHARACTER_ARMOR.has(slotTypeId)
            )
                return true;
        }

        return false;
    }

    isRiding(): boolean {
        const riding = this.player.getComponent("riding")?.entityRidingOn;
        return riding !== undefined && riding !== null;
    }

    isWearingTransformHelmet(): boolean {
        const equipment = InventoryUtil.getEquipment(this.player).getEquipment(EquipmentSlot.Head);

        if (!equipment || !CharActivation.CHARACTER_HELMETS.has(equipment.typeId)) return false;

        return true;
    }

    getHelmetIdFromToken(itemId: string): string {
        itemId = itemId.replace(":", ":transform_helmet_");
        itemId = itemId.replace("_life", "");

        return itemId;
    }

    loadPlayer(): void {
        if (!this.isWearingTransformHelmet()) return;

        const handItem = InventoryUtil.selectedItem(this.player);

        if (!handItem || !CharActivation.CHARACTER_TOKENS.has(handItem.typeId)) return;

        this.onTransformComplete(handItem.typeId, true);
    }

    // Fix for ORDER-1040
    armorFailsafe() {
        if (!this.currentCharacter) {
            const equipment = InventoryUtil.getEquipment(this.player);
            const helmet = equipment.getEquipment(EquipmentSlot.Head);
            const chestplate = equipment.getEquipment(EquipmentSlot.Chest);
            const leggings = equipment.getEquipment(EquipmentSlot.Legs);
            const boots = equipment.getEquipment(EquipmentSlot.Feet);

            if (helmet?.typeId.startsWith("gm1_ord:")) equipment.setEquipment(EquipmentSlot.Head, undefined);
            if (chestplate?.typeId.startsWith("gm1_ord:")) equipment.setEquipment(EquipmentSlot.Chest, undefined);
            if (leggings?.typeId.startsWith("gm1_ord:")) equipment.setEquipment(EquipmentSlot.Legs, undefined);
            if (boots?.typeId.startsWith("gm1_ord:")) equipment.setEquipment(EquipmentSlot.Feet, undefined);
        }
    }

    constructor(entity: Entity) {
        super(entity, 5);

        this.player = entity as Player;

        this.loadPlayer();

        this.onWorldEvent("WorldAfterEvents", "itemStartUse", (event) => {
            if (!CharActivation.CHARACTER_TOKENS.has(event.itemStack.typeId)) return;
            if (event.source?.id !== this.player.id) return;
            if (!EntityUtil.isValid(event.source)) return;

            this.armorFailsafe();

            this.itemInUse = true;

            if (this.transformLock) return;

            if (this.currentCharacter) {
                this.onDetransformStart();
                return;
            }

            if (this.isWearingArmor()) {
                BroadcastUtil.actionbar({ rawtext: [{ translate: "gm1_ord.char.transform.remove_armor" }] }, [this.player]);
                return;
            }

            if (this.isRiding()) {
                BroadcastUtil.actionbar({ rawtext: [{ translate: "gm1_ord.char.transform.stop_riding" }] }, [this.player]);
                return;
            }

            this.onTransformStart(event.itemStack.typeId);
        });
        this.onWorldEvent("WorldAfterEvents", "itemStopUse", (event) => {
            if (!event.itemStack || !CharActivation.CHARACTER_TOKENS.has(event.itemStack.typeId)) return;
            if (event.source?.id !== this.player.id) return;
            if (!EntityUtil.isValid(event.source)) return;

            this.itemInUse = false;

            if (this.justTransformed !== 0) return;

            this.transformLock = false;

            if (this.transformLock) {
                return;
            }

            if (this.currentCharacter) {
                this.onDetransformCancel();
                return;
            }

            this.onTransformCancel(event.itemStack.typeId);
        });
        this.onWorldEvent("WorldAfterEvents", "itemCompleteUse", (event) => {
            if (!CharActivation.CHARACTER_TOKENS.has(event.itemStack.typeId)) return;
            if (event.source?.id !== this.player.id) return;
            if (!EntityUtil.isValid(event.source)) return;

            this.justTransformed = 3;

            if (this.transformLock) return;

            this.transformLock = true;

            if (this.currentCharacter) {
                this.onDetransformComplete();
                return;
            }

            if (this.isWearingArmor()) {
                this.onTransformCancel(event.itemStack.typeId);
                return;
            }

            if (this.isRiding()) {
                this.onTransformCancel(event.itemStack.typeId);
                return;
            }

            this.onTransformComplete(event.itemStack.typeId);
        });
    }

    process() {
        if (!EntityUtil.isValid(this.player)) return;

        this.processItemDetransform();
        this.updateTransformLock();
        const playerPos = this.player.location;
        this.processWaterDetransform(playerPos);
        this.processLavaDetransform(playerPos, this.player.dimension);
    }

    processItemDetransform(): void {
        if (!this.currentCharacter) return;

        const current_item = InventoryUtil.selectedItem(this.player);
        const item_id = current_item?.typeId;

        if (item_id === this.previousItem) return;

        if (
            this.currentCharacter !== undefined &&
            this.previousItem !== undefined &&
            this.justTransformed === 0 &&
            CharActivation.CHARACTER_TOKENS.get(this.previousItem) !== undefined
        ) {
            this.transformLock = false;
            this.onDetransformComplete();
        }

        this.previousItem = item_id;
    }

    updateTransformLock(): void {
        if (this.justTransformed <= 0) return;

        this.justTransformed -= 1;

        if (this.justTransformed > 0 || this.itemInUse) return;

        this.transformLock = false;
    }

    processWaterDetransform(playerPos: Vector3): void {
        if (!this.currentCharacter) return;

        const headBlockPos = new V3(playerPos);
        headBlockPos.y += 1;
        const headBlock = BlockUtil.GetBlock(this.player.dimension, headBlockPos);
        const blockType = headBlock?.typeId;

        if (!blockType || (blockType !== "minecraft:water" && blockType !== "minecraft:flowing_water")) {
            this.inWater = false;
            return;
        }

        if (!this.inWater) {
            this.inWater = true;
            this.inWaterTicks = 1;
            return;
        }

        this.inWaterTicks += 1;
        if (this.inWaterTicks > GameData.WaterDetransformDelay) this.onDetransformComplete();
    }

    processLavaDetransform(playerPos: Vector3, dimension: Dimension): void {
        if (!this.currentCharacter) return;

        const feetBlock = BlockUtil.GetBlock(dimension, playerPos);
        const feetBlockType = feetBlock?.typeId;
        if (feetBlockType && (feetBlockType === "minecraft:lava" || feetBlockType === "minecraft:flowing_lava")) {
            this.onDetransformComplete();
        }
    }

    onTransformStart(tokenId: string) {
        this.player.dimension.playSound("transform_charge", this.player.location);
        this.player.inputPermissions.movementEnabled = false;

        this.previousItem = tokenId;

        const equipment = InventoryUtil.getEquipment(this.player);
        const unbreaking = EnchantmentTypes.get("unbreaking")!;
        const vanishing = EnchantmentTypes.get("vanishing")!;
        const helmet = new ItemStack(this.getHelmetIdFromToken(tokenId), 1);
        helmet.lockMode = ItemLockMode.slot;
        const helmetEnchantComp = helmet.getComponent(ItemEnchantableComponent.componentId) as ItemEnchantableComponent;

        if (helmetEnchantComp) {
            helmetEnchantComp.addEnchantment({ level: 3, type: unbreaking });
            helmetEnchantComp.addEnchantment({ level: 1, type: vanishing });
        }

        const durabilityComp = helmet.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

        if (durabilityComp) {
            durabilityComp.damage = 2;
            equipment.setEquipment(EquipmentSlot.Head, helmet);
        }

        this.equipArmorViaSwap(EquipmentSlot.Head, new ItemStack("minecraft:leather_helmet"), helmet, equipment);
        //equipment.setEquipment(EquipmentSlot.Head, helmet);

        return tokenId;
    }

    onDetransformStart() {
        this.player.inputPermissions.movementEnabled = false;
        this.player.removeEffect("invisibility");

        this.setHelmetDurability(1);
    }

    onTransformCancel(tokenId: string) {
        this.player.inputPermissions.movementEnabled = true;
        this.player.runCommand("stopsound @s transform_charge");

        InventoryUtil.getEquipment(this.player).setEquipment(EquipmentSlot.Head, undefined);

        return tokenId;
    }

    onDetransformCancel() {
        this.player.inputPermissions.movementEnabled = true;
        this.player.addEffect("invisibility", 20000000, {
            showParticles: false,
        });

        this.setHelmetDurability(0);
    }

    setHelmetDurability(newValue: number) {
        const equipment = InventoryUtil.getEquipment(this.player);
        const helmet = equipment.getEquipment(EquipmentSlot.Head);

        if (!helmet) return;

        const durabilityComp = helmet.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

        if (!durabilityComp) return;

        durabilityComp.damage = newValue;
        equipment.setEquipment(EquipmentSlot.Head, helmet);
    }

    // We need to equip the armour via this swap with vanilla armour first to prevent an engine issue where players do not get knockback if we apply our armour first.
    // We can remove this if the engine issue is fixed.
    equipArmorViaSwap(slot: EquipmentSlot, temporaryArmor: ItemStack, finalArmor: ItemStack, equipment: EntityEquippableComponent) {
        equipment.setEquipment(slot, temporaryArmor);
        Runner.timeout(() => {
            equipment.setEquipment(slot, finalArmor);
        }, 1);
    }

    startFreeTimeRingConsumption() {
        let remainingFreeTime = this.Transfer_Parameter.freeTime;

        this.freeTimeInterval = system.runInterval(() => {
            if (!this.entity?.isValid() || !CharActivation.SUPER_TOKENS.has(this.currentCharacter!)) {
                this.stopRingConsumption();
                return;
            }
            if (remainingFreeTime <= 0) {
                system.clearRun(this.freeTimeInterval!);
                this.startRingConsumption();
                return;
            }
            remainingFreeTime--;
        }, 20);
    }

    startRingConsumption() {
        this.ringConsumptionInterval = system.runInterval(() => {
            if (!this.entity?.isValid() || !CharActivation.SUPER_TOKENS.has(this.currentCharacter!)) {
                this.stopRingConsumption();
                return;
            }

            const super_name = CharActivation.SUPER_NAMES.get(this.currentCharacter!);

            const remainingRings = InventoryUtil.getItemCount(this.player, new ItemStack("gm1_ord:ring_spawn_egg"));
            if (!this.isConsumingRings) {
                this.isConsumingRings = true;
                const message = { translate: "chaos_machine.super_transform.consume_ring.start", with: [super_name!] };
                BroadcastUtil.actionbar(message, [this.player]);
            }
            if (remainingRings <= 0) {
                const message = { translate: "chaos_machine.super_transform.out_of_ring", with: [super_name!] };
                BroadcastUtil.actionbar(message, [this.player]);
                this.onTransformComplete(CharActivation.SUPER_TOKENS.get(this.currentCharacter!)!);
                this.replaceSuperTokens();
                this.justTransformed = 1;
                this.stopRingConsumption();
                return;
            }
            this.consumeRings(1);
            const message = {
                translate: "chaos_machine.super_transform.consume_ring.count",
                with: [super_name!, (remainingRings - 1).toString()],
            };
            BroadcastUtil.actionbar(message, [this.player]);
        }, this.Transfer_Parameter.consumeRate * 20);
    }

    stopRingConsumption() {
        if (this.ringConsumptionInterval) {
            system.clearRun(this.ringConsumptionInterval);
            this.ringConsumptionInterval = undefined;
        }

        if (this.freeTimeInterval) {
            system.clearRun(this.freeTimeInterval);
            this.freeTimeInterval = undefined;
        }
        this.isConsumingRings = false;
    }

    consumeRings(count: number) {
        let remaining = count;

        const inventory = InventoryUtil.getInventory(this.player);
        if (!inventory) return;

        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item && item.typeId === "gm1_ord:ring_spawn_egg") {
                if (item.amount > remaining) {
                    // current stack is enough
                    item.amount -= remaining;
                    inventory.setItem(i, item); // update item in inventory
                    return;
                } else {
                    // current stack is not enough, consume all
                    remaining -= item.amount;
                    inventory.setItem(i, undefined); // delete current slot
                }
            }
        }
    }

    onTransformComplete(tokenId: string, worldReload?: boolean) {
        this.currentCharacter = tokenId;
        const characterIndex = CharActivation.CHARACTER_TOKENS.get(this.currentCharacter);

        if (characterIndex === undefined) return;

        if (CharActivation.SUPER_TOKENS.has(tokenId)) {
            this.player.dimension.playSound("super_transform_jingle", this.player.location);
            this.startFreeTimeRingConsumption();
        } else {
            this.player.dimension.playSound("transform_jingle", this.player.location);
        }

        this.addEffects(GameData.CharDesignVars[tokenId].jumpBoost);
        this.player.inputPermissions.movementEnabled = true;

        if (this.player.getGameMode() === GameMode.creative) {
            this.setLeggingsDurability(7);
        }

        const equipment = InventoryUtil.getEquipment(this.player);
        const unbreaking = EnchantmentTypes.get("unbreaking")!;
        const vanishing = EnchantmentTypes.get("vanishing")!;

        // Helper function to create and equip items with unbreaking
        const equipUnbreakingItem = (slot: EquipmentSlot, itemId: string, tempId?: string) => {
            const item = new ItemStack(itemId, 1);
            item.lockMode = ItemLockMode.slot;

            const enchantComp = item.getComponent(ItemEnchantableComponent.componentId) as ItemEnchantableComponent;
            if (enchantComp) {
                enchantComp.addEnchantment({ level: 3, type: unbreaking });
                enchantComp.addEnchantment({ level: 1, type: vanishing });
            }

            if (!tempId) {
                equipment.setEquipment(slot, item);
                return;
            }
            this.equipArmorViaSwap(slot, new ItemStack(tempId), item, equipment);
        };

        if (worldReload) {
            equipUnbreakingItem(EquipmentSlot.Head, this.getHelmetIdFromToken(this.currentCharacter), "minecraft:leather_helmet");
        } else {
            equipUnbreakingItem(EquipmentSlot.Head, this.getHelmetIdFromToken(this.currentCharacter));
        }
        equipUnbreakingItem(EquipmentSlot.Chest, "gm1_ord:transform_chestplate", "minecraft:leather_chestplate");
        equipUnbreakingItem(EquipmentSlot.Legs, "gm1_ord:transform_leggings", "minecraft:leather_leggings");
        equipUnbreakingItem(EquipmentSlot.Feet, "gm1_ord:transform_boots", "minecraft:leather_boots");

        this.attachRiders();

        const movementComponent = MobComponentManager.getInstanceOfComponent(PlayerMovement, this.player);

        if (movementComponent) {
            movementComponent.ClearAllReplacedBlocks();
        }
    }

    onDetransformComplete() {
        this.currentCharacter = undefined;
        this.previousItem = undefined; // This variable is used to trigger detransform on hotbar item swap, and if we don't clear it here the system can get confused
        this.player.dimension.playSound("detransform", this.player.location);

        this.removeEffects();
        this.player.addEffect("hunger", GameData.DetransformHungerDuration * TicksPerSecond, {
            amplifier: GameData.DetransformHungerAmplifier,
        });

        this.player.inputPermissions.movementEnabled = true;
        this.cleanupRiders();

        // We need to check all hotbar slots for potential super tokens in case the player detransformed by switching items
        this.replaceSuperTokens();

        const equipment = InventoryUtil.getEquipment(this.player);

        if (equipment) {
            const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];

            for (let i = 0; i < slots.length; i++) {
                const armorStack = equipment.getEquipment(slots[i]);

                if (!armorStack) continue;

                if (CharActivation.CHARACTER_HELMETS.has(armorStack.typeId)) {
                    this.previousCharacter = this.currentCharacter;
                    const durabilityComp = armorStack.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

                    if (!durabilityComp) return;

                    durabilityComp.damage = 1;
                    equipment.setEquipment(EquipmentSlot.Head, armorStack);

                    Runner.timeout(() => {
                        if (this.previousCharacter !== this.currentCharacter) return;

                        const durabilityComp = armorStack.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

                        if (durabilityComp.damage === 2) return;

                        equipment.setEquipment(slots[i], undefined);
                    }, GameData.DetransformHelmetDelay);
                } else if (CharActivation.CHARACTER_ARMOR.has(armorStack.typeId)) equipment.setEquipment(slots[i], undefined);
            }
        }

        const movementComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, this.player);

        if (!movementComp) return;

        // Cancel any ability currently active or charged
        movementComp.numberOfTicksSneakHasBeenHeld = 0;
        movementComp.SetChestplateDurability(0);
        movementComp.inAbilityMode = false;
        movementComp.inHoverMode = false;
        movementComp.inGlideMode = false;
        movementComp.momentum = 0;
        movementComp.verticalKnockback = 0;
        movementComp.axialKnockback = V3.zero;
        movementComp.homingTarget = undefined;
        movementComp.pmBoost.inBoostMode = false;
        movementComp.pmBoost.DespawnMiner();
        movementComp.ClearHomingList();

        const homingIndicator = movementComp.homingIndicator;

        if (homingIndicator) {
            homingIndicator.remove();
            movementComp.homingIndicator = undefined;
        }

        movementComp.ClearAllReplacedBlocks();
    }

    replaceSuperTokens() {
        const inventory = InventoryUtil.getInventory(this.entity!);
        if (!inventory) return;
        for (let i = 0; i < 9; i++) {
            const item = inventory.getItem(i);
            if (!item) continue;
            const itemType = item.typeId;
            if (!CharActivation.SUPER_TOKENS.has(itemType)) continue;
            inventory.setItem(i, new ItemStack(CharActivation.SUPER_TOKENS.get(itemType)!, item.amount));
        }
    }

    setLeggingsDurability(newValue: number) {
        if (!EntityUtil.isValid(this.player)) return;

        const equipment = InventoryUtil.getEquipment(this.player);
        const leggings = equipment.getEquipment(EquipmentSlot.Legs);

        if (!leggings) return;

        const durabilityComp = leggings.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

        if (!durabilityComp) return;

        durabilityComp.damage = newValue;
        equipment.setEquipment(EquipmentSlot.Legs, leggings);
    }

    addEffects(jumpBoost: number) {
        const effects = {
            invisibility: { amplifier: 1 },
            resistance: { amplifier: 255 },
            weakness: { amplifier: 255 },
            mining_fatigue: { amplifier: 255 },
            saturation: { amplifier: 255 },
            jump_boost: { amplifier: jumpBoost },
        };

        for (const effectId in effects) {
            const effect = effects[effectId];
            this.player.addEffect(effectId, 20000000, { amplifier: effect.amplifier, showParticles: false });
        }
    }

    removeEffects() {
        const effects = ["invisibility", "resistance", "weakness", "mining_fatigue", "saturation", "jump_boost"];

        for (const effect of effects) {
            this.player.removeEffect(effect);
        }
    }

    attachRiders() {
        const rideable = this.player?.getComponent("minecraft:rideable") as EntityRideableComponent;

        rideable.ejectRiders();
        const summonLocation = this.player?.location;
        const summonDimension = this.player?.dimension;
        if (!summonLocation || !summonDimension || !BlockUtil.InHeightBounds(summonLocation, summonDimension.id)) return;
        this.dummy_rider1 = EntityUtil.spawnEntity("gm1_ord:dummy", summonLocation, summonDimension);
        rideable.addRider(this.dummy_rider1);
        this.dummy_rider2 = EntityUtil.spawnEntity("gm1_ord:dummy", summonLocation, summonDimension);
        rideable.addRider(this.dummy_rider2);
    }

    cleanupRiders() {
        const rideable = this.player?.getComponent("minecraft:rideable") as EntityRideableComponent;
        rideable.getRiders().forEach((rider) => {
            if (rider.typeId == "gm1_ord:dummy") {
                rider.triggerEvent("gm1_ord:clean_up");
                if (rider === this.dummy_rider1) {
                    this.dummy_rider1 = null;
                } else if (rider === this.dummy_rider2) {
                    this.dummy_rider2 = null;
                }
            }
        });
    }
}
