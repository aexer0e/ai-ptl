import { Entity, ItemLockMode, ItemStack, Player, system } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityStore from "Store/Entity/EntityStore";
import BroadcastUtil from "Utilities/BroadcastUtil";
import InventoryUtil from "Utilities/InventoryUtil";
import V3 from "Wrappers/V3";
import CharActivation from "./CharActivation";
import MobComponent from "./MobComponent";

export default class ChaosMachine extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:chaos_machine"];

    readonly EmeraldPropIDs = [
        "gm1_ord:has_emerald_green",
        "gm1_ord:has_emerald_blue",
        "gm1_ord:has_emerald_red",
        "gm1_ord:has_emerald_purple",
        "gm1_ord:has_emerald_yellow",
        "gm1_ord:has_emerald_white",
        "gm1_ord:has_emerald_cyan",
    ];

    // gm1_ord:sonic_life ---> gm1_ord:super_sonic_life
    // gm1_ord:shadow_life ---> gm1_ord:super_shadow_life
    readonly SuperCharacters = new Map<string, string>([
        ["gm1_ord:sonic_life", "gm1_ord:super_sonic_life"],
        ["gm1_ord:shadow_life", "gm1_ord:super_shadow_life"],
    ]);

    targetPlayer: Player | undefined = undefined;
    machinePos: V3;

    detectionRunner: number | undefined = undefined;
    particleRunner: number | undefined = undefined;
    animTimeoutRunner: number | undefined = undefined;

    isPlayingActivateAnimation = false;

    constructor(entity: Entity) {
        super(entity, 20);

        this.machinePos = new V3(entity.location);

        // Reset the entity so that on world reload it can re-acquire a target player
        entity.setProperty("gm1_ord:is_playing_transform_animation", false); // TODO: check use case do we need art property?
        entity.setProperty("gm1_ord:is_playing_activate_animation", false);
        for (let i = 0; i < this.EmeraldPropIDs.length; i++) {
            entity.setProperty(this.EmeraldPropIDs[i], false);
        }
        entity.triggerEvent("gm1_ord:chaos_machine_reset");
    }

    process() {
        if (!this.entity || !this.entity.isValid()) return;
        if (!this.targetPlayer) return;

        const playerPosition = new V3(this.targetPlayer!.location);
        const distToPlatform = V3.distance(this.machinePos.addY(1), playerPosition); // Check if player is standing on top of the machine
        const distToMachine = V3.distance(this.machinePos, playerPosition); // Check if player has walked far away from machine

        // check if player are sonic or shadow, otherwise set false
        const charActivation = MobComponentManager.getInstanceOfComponent(CharActivation, this.targetPlayer) as CharActivation;
        const currentCharacter = charActivation?.currentCharacter;
        const isTransformable = currentCharacter ? this.SuperCharacters.has(currentCharacter) : false;
        const isSuperForm = currentCharacter
            ? currentCharacter === "gm1_ord:super_sonic_life" || currentCharacter === "gm1_ord:super_shadow_life"
            : false;

        const hasAllEmeralds = this.EmeraldPropIDs.every((emeraldId) => {
            return this.entity?.getProperty(emeraldId);
        });

        // display fail action bar message if player is not sonic / shadow or has not collect all emeralds
        if (distToPlatform <= 1) {
            if (!isTransformable && !isSuperForm) {
                const message = { translate: "chaos_machine.player.transform.fail" };
                BroadcastUtil.actionbar(message, [this.targetPlayer]);
            } else if (!hasAllEmeralds) {
                const message = { translate: "chaos_machine.no_emerald.transform.fail" };
                BroadcastUtil.actionbar(message, [this.targetPlayer]);
            }
        }

        if (distToPlatform <= 1 && !this.isPlayingActivateAnimation && isTransformable && hasAllEmeralds) {
            this.isPlayingActivateAnimation = true;
            charActivation.setHelmetDurability(5);
            this.playActivateAnimation();
        } else if (distToPlatform > 1 && this.isPlayingActivateAnimation) {
            // Check if player has left the platform mid-transformation and if so, cancel transformation
            charActivation.setHelmetDurability(0);
            if (this.detectionRunner) system.clearRun(this.detectionRunner);
            if (this.animTimeoutRunner) {
                system.clearRun(this.animTimeoutRunner);
                system.clearRun(this.particleRunner!);
                this.entity?.setProperty("gm1_ord:is_playing_activate_animation", false);
            }
            this.isPlayingActivateAnimation = false;
        }

        if (distToMachine >= GameData.CMDeactivationDistance) {
            this.targetPlayer = undefined;
            this.entity!.triggerEvent("gm1_ord:chaos_machine_reset");
            for (const emeraldID of this.EmeraldPropIDs) {
                this.entity!.setProperty(emeraldID, false);
            }
        }
    }

    initialize() {
        this.targetPlayer = this.entity!.dimension.getPlayers({ closest: 1, location: this.machinePos })[0];
        const emeraldStage = EntityStore.get(this.targetPlayer, "EmeraldStage");
        for (let i = 0; i < emeraldStage; i++) {
            this.entity!.setProperty(this.EmeraldPropIDs[i], true);
        }
    }

    playActivateAnimation() {
        // add this for destroy entity
        if (!this.isEntityAndDimensionValid()) return;

        this.particleRunner = system.runInterval(() => {
            // add this for destroy entity
            if (!this.isEntityAndDimensionValid()) {
                system.clearRun(this.particleRunner!);
                return;
            }
        }, 5);

        const animationTime = 100;
        this.entity?.setProperty("gm1_ord:is_playing_activate_animation", true);

        this.animTimeoutRunner = this.timeout(() => {
            system.clearRun(this.particleRunner!);
            this.isPlayingActivateAnimation = false;
            this.startDetectionRunner();
            this.entity?.setProperty("gm1_ord:is_playing_activate_animation", false);
        }, animationTime);
    }

    isEntityAndDimensionValid(): boolean {
        return !!(this.entity && this.entity.isValid() && this.entity.dimension);
    }

    startDetectionRunner() {
        this.detectionRunner = system.runInterval(() => {
            if (!this.entity || !this.entity.isValid()) {
                system.clearRun(this.detectionRunner!);
                return;
            }
            const players = this.entity!.dimension.getPlayers();

            for (const player of players) {
                if (!player.isValid()) continue;

                const playerPos = player.location;
                const machinePos = new V3(this.machinePos).addY(1);

                if (V3.distance(playerPos, machinePos) < 0.6) {
                    const charActivation = MobComponentManager.getInstanceOfComponent(CharActivation, player);

                    if (charActivation.currentCharacter && this.SuperCharacters.has(charActivation.currentCharacter)) {
                        this.transformPlayer(player, charActivation);
                        system.clearRun(this.detectionRunner!);
                        return;
                    }
                }
            }
        }, 10);
    }

    transformPlayer(player: Player, charActivation: CharActivation) {
        if (!player.isValid() || !charActivation) return;

        const superFormToken = this.SuperCharacters.get(charActivation.currentCharacter!);
        if (!superFormToken) return;

        let successMessageKey: string;
        switch (superFormToken) {
            case "gm1_ord:super_sonic_life":
                successMessageKey = "chaos_machine.player.transform.success.super_sonic";
                break;
            case "gm1_ord:super_shadow_life":
                successMessageKey = "chaos_machine.player.transform.success.super_shadow";
                break;
            default:
                return;
        }
        BroadcastUtil.say({ translate: successMessageKey }, [player]);

        charActivation.onTransformComplete(superFormToken);
        const currentLifeItem = InventoryUtil.selectedItem(player);
        const superToken = new ItemStack(superFormToken, currentLifeItem!.amount);
        superToken.lockMode = ItemLockMode.slot;
        InventoryUtil.setSelectedSlot(player, superToken);
        charActivation.justTransformed = 2; // A small number of ticks to make sure it doesn't detect the item change as detransformation
    }
}
