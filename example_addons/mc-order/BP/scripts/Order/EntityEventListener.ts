import { DataDrivenEntityTriggerAfterEvent, Entity, EntityRideableComponent, ItemStack, Player, system } from "@minecraft/server";
import GameData from "Game/GameData";
import SoundData from "Game/Sound/SoundData";
import MobComponentManager from "MobComponents/MobComponentManager";
import ChaosMachine from "MobComponents/MobComponents/ChaosMachine";
import CharActivation from "MobComponents/MobComponents/CharActivation";
import PlayerMovement from "MobComponents/MobComponents/PlayerMovement";
import ShrineMarker from "MobComponents/MobComponents/ShrineMarker";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import EntityUtil from "Utilities/EntityUtil";
import EventUtil from "Utilities/EventUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import V3 from "Wrappers/V3";

/**
 * EntityEventListener class to handle dataDrivenEntityTrigger events.
 */
export default class EntityEventListener {
    /**
     * Initializes the event listener by subscribing to the script event receive.
     */
    static init() {
        EventUtil.subscribe("WorldAfterEvents", "dataDrivenEntityTrigger", this.onEntityEventReceive.bind(this));
    }

    /**
     * Handles the script event receive.
     * @param event The event data received.
     */
    static onEntityEventReceive(eventData: DataDrivenEntityTriggerAfterEvent) {
        const eventId = eventData.eventId;
        if (!eventId.startsWith("gm1_ord")) return;

        const entity = eventData.entity;
        if (!EntityUtil.isValid(entity)) return;
        const entityTypeId = entity.typeId;
        const entityLoc = entity.location;
        const entityDimension = entity.dimension;

        if (eventId === "gm1_ord:activated") {
            if (entityTypeId === "gm1_ord:lf_spring_yellow" || entityTypeId === "gm1_ord:lf_spring_red") {
                const springer = entityDimension.getEntities({
                    location: entityLoc,
                    closest: 1,
                    excludeTypes: [
                        "gm1_ord:dummy",
                        "gm1_ord:lf_spring_yellow",
                        "gm1_ord:lf_spring_red",
                        "gm1_ord:lf_dash_panel",
                        "gm1_ord:lf_jump_panel",
                        "gm1_ord:spring",
                        "minecraft:item",
                        "gm1_ord:homing_indicator",
                    ],
                })[0];

                if (!springer) return;

                let noMomentumSpringStrength = 0;
                let momentumSpringStrength = 0;

                // Default spring
                if (entityTypeId === "gm1_ord:lf_spring_yellow") {
                    noMomentumSpringStrength = GameData.YellowSpringNoMomentumKnockback;
                    momentumSpringStrength = GameData.YellowSpringMomentumKnockback;
                } // Check if the spring is red
                else if (entityTypeId === "gm1_ord:lf_spring_red") {
                    // Double the spring for red springs
                    noMomentumSpringStrength = GameData.RedSpringNoMomentumKnockback;
                    momentumSpringStrength = GameData.RedSpringMomentumKnockback;
                }

                if (this.tryDropRideableEntity(springer)) return;

                // if (this.timeSince(EntityStore.temporary.get(springer, "SprungTimestamp")) < 10) return;
                EntityStore.temporary.set(springer, "SprungTimestamp", system.currentTick);

                const moveComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, springer);

                const knockbackStrength = noMomentumSpringStrength + Math.sqrt(Math.abs(springer.getVelocity().y)) / 2;

                if (moveComp) {
                    moveComp.landedSinceSneakAbility = true;
                    moveComp.canTryHoming = true;
                    moveComp.jumpNumber = 1;
                    if (moveComp.inHoverMode || moveComp.inGlideMode) moveComp.axialKnockback.y = knockbackStrength;

                    const leggingsValue = moveComp.GetLeggingsDurability();
                    // Don't signal the AC to recognize a spring if the player is Hovering, Gliding, creative mode flying, or Super Sonic flying
                    if (leggingsValue !== 3 && leggingsValue !== 6 && leggingsValue !== 7 && leggingsValue !== 10) {
                        moveComp.SetLeggingsDurability(11);
                        moveComp.timeout(() => moveComp.SetLeggingsDurability(0), 1);
                    }
                }

                if (moveComp && moveComp.homingTarget?.id !== entity.id && moveComp.jumpNumber > 1) noMomentumSpringStrength /= 1.75;

                if (
                    springer.typeId !== "minecraft:player" &&
                    (springer.getVelocity().y < -0.5 || this.timeSince(EntityStore.temporary.get(springer, "SprungTimestamp")) < 2)
                ) {
                    springer.teleport(new V3(springer.location).setY(entity.location.y));
                    system.runTimeout(() => springer.teleport(new V3(springer.location).setY(entity.location.y)), 1);
                    system.runTimeout(() => {
                        springer.applyKnockback(0, 0, 0, knockbackStrength);
                        if (entityTypeId.startsWith("gm1_ord:lf_spring")) entity.triggerEvent("gm1_ord:activated_animation.add");
                    }, 2);
                } else {
                    springer.applyKnockback(0, 0, 0, knockbackStrength);
                    if (entityTypeId.startsWith("gm1_ord:lf_spring")) entity.triggerEvent("gm1_ord:activated_animation.add");
                }

                if (!moveComp || moveComp.momentum <= GameData.MinMomentum) return;
                moveComp.verticalKnockback = momentumSpringStrength;
            } else if (entityTypeId === "gm1_ord:lf_jump_panel") {
                const springer = entityDimension.getEntities({
                    location: entityLoc,
                    closest: 1,
                    excludeTypes: [
                        "gm1_ord:dummy",
                        "gm1_ord:lf_spring_yellow",
                        "gm1_ord:lf_spring_red",
                        "gm1_ord:lf_dash_panel",
                        "gm1_ord:lf_jump_panel",
                        "gm1_ord:spring",
                        "minecraft:item",
                        "gm1_ord:homing_indicator",
                    ],
                })[0];

                if (!springer) return;

                SoundData.feature.jump_panel.playWorld(entityDimension, entityLoc);

                let dir = new V3(entity.getViewDirection());
                dir.y = 0;
                dir = dir.normalize().multiply(-1);

                if (this.tryDropRideableEntity(springer)) return;

                const moveComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, springer);

                springer.applyKnockback(dir.x, dir.z, GameData.JumpPanelNoMomentumHKnockback, GameData.JumpPanelNoMomentumVKnockback);

                if (!moveComp || moveComp.momentum <= GameData.MinMomentum) return;

                moveComp.verticalKnockback = GameData.JumpPanelMomentumVKnockback;
                moveComp.axialKnockback = dir.multiply(GameData.JumpPanelMomentumHKnockback);
            } else if (entityTypeId === "gm1_ord:lf_dash_panel") {
                const springer = entityDimension.getEntities({
                    location: entityLoc,
                    closest: 1,
                    excludeTypes: [
                        "gm1_ord:dummy",
                        "gm1_ord:lf_spring_yellow",
                        "gm1_ord:lf_spring_red",
                        "gm1_ord:lf_dash_panel",
                        "gm1_ord:lf_jump_panel",
                        "gm1_ord:spring",
                        "minecraft:item",
                        "gm1_ord:homing_indicator",
                    ],
                })[0];

                if (!springer) return;

                SoundData.feature.dash_panel.playWorld(entityDimension, entityLoc);

                let dir = new V3(entity.getViewDirection());
                dir.y = 0;
                dir = dir.normalize().multiply(-1);

                if (this.tryDropRideableEntity(springer)) return;

                const moveComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, springer);

                springer.applyKnockback(dir.x, dir.z, GameData.DashPanelNoMomentumKnockback, 0.0);

                if (!moveComp || moveComp.momentum <= GameData.MinMomentum) return;

                moveComp.axialKnockback = dir.multiply(GameData.DashPanelMomentumKnockback);
            }
        } else if (eventId === "gm1_ord:ring_try_collect") {
            if (!entity) return;

            const nearestPlayer = entityDimension.getPlayers({ closest: 1, location: entity.location })[0];
            const ringAmt = entity.getProperty("gm1_ord:give_amount") as number;
            const isInventoryFull = InventoryUtil.emptySlotsCount(nearestPlayer) === 0;

            if (isInventoryFull && ringAmt == 1) {
                const ring = new ItemStack("gm1_ord:ring_spawn_egg");
                const maxStackSize = ring.maxAmount;

                const ringStacks = InventoryUtil.findItem(nearestPlayer, ring);

                let canGiveRing = false;

                for (const stack of ringStacks) {
                    if (stack.itemStack.amount >= maxStackSize) continue;
                    canGiveRing = true;
                    break;
                }

                if (!canGiveRing) {
                    entity.triggerEvent("gm1_ord:ring_reject_collect");
                    BroadcastUtil.actionbar({ translate: "gm1_ord.ring.collect_failed" }, [nearestPlayer]);
                    return;
                }
            }

            const charComp = MobComponentManager.getInstanceOfComponent(CharActivation, nearestPlayer);
            const distToRing = V3.distance(nearestPlayer.location, entity.location);
            if (
                charComp.currentCharacter &&
                CharActivation.SUPER_TOKENS.has(charComp.currentCharacter) &&
                distToRing > GameData.SuperRingPickupRange
            ) {
                entity.triggerEvent("gm1_ord:ring_reject_collect");
                return;
            }

            entity.triggerEvent("gm1_ord:ring_collected");
            system.runJob(this.giveCoins(ringAmt, nearestPlayer));
        } else if (eventId === "gm1_ord:on_player_far") {
            const nearestPlayer = entityDimension.getPlayers({ closest: 1, location: entity.location })[0];
            const markerComp = MobComponentManager.getInstanceOfComponent(ShrineMarker, entity);
            markerComp?.onPlayerNearbyFar(nearestPlayer);
        } else if (eventId === "gm1_ord:on_player_close") {
            const nearestPlayer = entityDimension.getPlayers({ closest: 1, location: entity.location })[0];
            const markerComp = MobComponentManager.getInstanceOfComponent(ShrineMarker, entity);
            markerComp?.onPlayerNearbyClose(nearestPlayer);
        } else if (eventId === "gm1_ord:chaos_machine_initialize") {
            const machineComp = MobComponentManager.getInstanceOfComponent(ChaosMachine, entity);
            machineComp.initialize();
        }
    }

    static *giveCoins(amount: number, player: Player) {
        while (amount > 0) {
            if (amount >= 64) {
                InventoryUtil.giveItem(player, new ItemStack("gm1_ord:ring_spawn_egg", 64));
                amount -= 64;
            } else {
                InventoryUtil.giveItem(player, new ItemStack("gm1_ord:ring_spawn_egg", amount));
                amount = 0;
            }
            yield;
        }
    }

    static timeSince(timestamp: number): number {
        return system.currentTick - timestamp;
    }

    static tryDropRideableEntity(entity: Entity): boolean {
        const entityTypeId = entity.typeId;
        if (entityTypeId !== "minecraft:minecart" && entityTypeId !== "minecraft:boat") return false;

        this.tryTeleportLevelFeatureFromSpringer(entity);
        entity.dimension.spawnItem(new ItemStack(entityTypeId), entity.location);
        entity.remove();

        return true;
    }

    static tryTeleportLevelFeatureFromSpringer(springer: Entity): void {
        const rideable = springer.getComponent("minecraft:rideable") as EntityRideableComponent;

        if (!rideable) return;

        rideable.getRiders().forEach((rider) => {
            const entityTypeId = rider.typeId;

            if (!GameData.LevelFeatureSpringerTypes.has(entityTypeId)) return;

            const location = EntityStore.get(rider, "blockLocation");

            rideable.ejectRider(rider);
            rider.teleport(location);
        });
    }
}
