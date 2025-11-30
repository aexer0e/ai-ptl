import { EquipmentSlot, ItemDurabilityComponent, ItemStack, Player, system, TicksPerSecond, Vector3 } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import CharActivation from "MobComponents/MobComponents/CharActivation";
import PlayerMovement from "MobComponents/MobComponents/PlayerMovement";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EntityUtil from "Utilities/EntityUtil";
import EventUtil from "Utilities/EventUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import Runner from "Utilities/Runner";
import V3 from "Wrappers/V3";

export default class CharHealth {
    static spawnPurgeRing(origin: Vector3, count: number, player: Player) {
        const stackBase = Math.floor(count / GameData.MaxDroppedRingStacks);
        let extras = count % GameData.MaxDroppedRingStacks;
        const ringCounts: number[] = [];

        for (let i = 0; i < GameData.MaxDroppedRingStacks; i++) {
            if (extras > 0) {
                ringCounts.push(stackBase + 1);
                extras -= 1;
            } else if (stackBase > 0) {
                ringCounts.push(stackBase);
            }
        }

        for (let i = ringCounts.length - 1; i >= 0; i--) {
            const rand = Math.floor(Math.random() * (i + 1));
            [ringCounts[i], ringCounts[rand]] = [ringCounts[rand], ringCounts[i]];
        }

        const block = player.dimension.getBlock(player.location);
        const modifier = block && GameData.LiquidRunBlocks.has(block.typeId) ? GameData.LiquidImpulseModifier : 1;

        const dimension = player.dimension;
        dimension.playSound("gm1_ord:ring_spread", origin);

        for (let i = 0; i < ringCounts.length; i++) {
            const ring = dimension.spawnEntity("gm1_ord:ring<gm1_ord:dropped_ring>", origin);
            ring.setProperty("gm1_ord:give_amount", ringCounts[i]);

            if (ringCounts[i] !== 1) {
                ring.nameTag = `${ringCounts[i]}`;
            }

            const xForce = Math.random() * (GameData.RingHImpulseRange[1] - GameData.RingHImpulseRange[0]) + GameData.RingHImpulseRange[0];
            const impulse = V3.fromYaw(((2 * Math.PI) / ringCounts.length) * (i + 1))
                .normalize()
                .multiply(xForce * modifier);
            impulse.y = Math.random() * (GameData.RingVImpulseRange[1] - GameData.RingVImpulseRange[0]) + GameData.RingVImpulseRange[0];
            ring.applyImpulse(impulse);
        }

        // Post-ring-drop invulnerability
        const movementComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, player);
        movementComp.invulnerable = true;
        CharHealth.SetPlayerLosingRings(player);

        system.runTimeout(
            () => {
                movementComp.EndInvulnerability();
            },
            (GameData.PostDamageInvulnerability - GameData.EndInvulnerabilityDelay) * TicksPerSecond
        );
    }

    static SetPlayerLosingRings(player: Player) {
        const equipment = InventoryUtil.getEquipment(player);
        const helmet = equipment.getEquipment(EquipmentSlot.Head);
        if (!helmet) return;

        const durabilityComp = helmet.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;
        if (!durabilityComp || durabilityComp.damage !== 0) return;

        durabilityComp.damage = 3;
        equipment.setEquipment(EquipmentSlot.Head, helmet);
    }

    static init() {
        EventUtil.subscribe("WorldAfterEvents", "entityHurt", (event) => {
            if (!(event.hurtEntity instanceof Player)) return;
            if (event.damage < 0) return;

            const player = event.hurtEntity;
            const charComp = MobComponentManager.getInstanceOfComponent(CharActivation, player);

            if (!charComp.currentCharacter || GameData.CharDesignVars[charComp.currentCharacter].invincible) return;

            const damageCause = event.damageSource.cause;
            const movementComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, player);
            if (movementComp.invulnerable && !GameData.AlwaysTakeDamageFrom.has(damageCause)) return;
            if (GameData.DamageSourceImmunities.has(damageCause)) return;

            const current_item = InventoryUtil.selectedItem(player);
            if (!current_item || current_item.typeId === undefined) return;

            const ring_stack_1 = new ItemStack("gm1_ord:ring_spawn_egg", 1);
            const ring_stack_200 = new ItemStack("gm1_ord:ring_spawn_egg", 200);
            const ring_count = InventoryUtil.getItemCount(player, ring_stack_1);

            if (ring_count > 0) {
                while (InventoryUtil.getItemCount(player, ring_stack_1) > 0) {
                    InventoryUtil.clearItem(player, ring_stack_200);
                }
                this.spawnPurgeRing(player.location, ring_count, player);
                return;
            }

            player.dimension.playSound("gm1_ord:character_damage", player.location);

            if (current_item.amount > 1) {
                current_item.amount -= 1;
                InventoryUtil.setInventoryItem(player, current_item, player.selectedSlotIndex);
                BroadcastUtil.translate("gm1_ord.life_lost", [player.name, { translate: `item.${charComp.currentCharacter}.name` }]);
                charComp.onDetransformComplete();
                return;
            }

            BroadcastUtil.translate("gm1_ord.life_lost", [player.name, { translate: `item.${charComp.currentCharacter}.name` }]);
            Runner.timeout(() => {
                if (!EntityUtil.isValid(player)) return;
                InventoryUtil.clearInventorySlot(player, player.selectedSlotIndex);
            }, 5);

            const equipment = InventoryUtil.getEquipment(player);
            const helmet = equipment.getEquipment(EquipmentSlot.Head);
            const durabilityComp = helmet?.getComponent(ItemDurabilityComponent.componentId) as ItemDurabilityComponent;

            if (durabilityComp) {
                durabilityComp.damage = 4;
                equipment.setEquipment(EquipmentSlot.Head, helmet);
            }
        });
    }
}
