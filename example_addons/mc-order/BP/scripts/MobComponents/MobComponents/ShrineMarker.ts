import { Entity, Player } from "@minecraft/server";
import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import EntityStore from "Store/Entity/EntityStore";
import WorldStore from "Store/World/WorldStore";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import ChaosEmerald from "./ChaosEmerald";
import MobComponent from "./MobComponent";

export enum ShrineType {
    Green,
    Blue,
    Red,
    Purple,
    Yellow,
    White,
    Cyan,
    Grey,
}

export const EmeraldEntityIDs = [
    "gm1_ord:chaos_emerald_green",
    "gm1_ord:chaos_emerald_blue",
    "gm1_ord:chaos_emerald_red",
    "gm1_ord:chaos_emerald_purple",
    "gm1_ord:chaos_emerald_yellow",
    "gm1_ord:chaos_emerald_white",
    "gm1_ord:chaos_emerald_cyan",
    "gm1_ord:chaos_emerald_gray",
];

export default class ShrineMarker extends MobComponent {
    static readonly EntityTypes = ["gm1_ord:shrine_marker"];

    staticState: "EmeraldChase" | "BossFight";
    state: "Offline" | "PreEmeraldChase" | "EmeraldChase" | "BossFight" = "Offline";
    shrineType?: ShrineType;
    resetTimeCount = 0;

    constructor(entity: Entity) {
        super(entity, 10);

        // entity.setProperty("gm1_ord:player_range_state", "none");
        this.staticState = MathUtil.seededChance(entity.id, GameData.ShrineEggmanSpawnChance) ? "BossFight" : "EmeraldChase";
        this.state = WorldStore.force.get(`Shrine_State_${entity.id}`, "Offline");
        const nearestPlayer = EntityUtil.getNearestPlayer(entity.location, entity.dimension, 64);
        if (nearestPlayer) this.onPlayerNearbyFar(nearestPlayer);
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        if (this.state == "PreEmeraldChase") {
            const linkedEmerald = EntityStore.getLinkedEntity(this.entity!, "emeraldLinkId");
            if (!linkedEmerald) return this.tryResetState();

            const distanceToLinkedTarget = this.getDistanceToTarget();
            if (distanceToLinkedTarget > GameData.ShrineDeactivationDistance) return this.tryResetState();
        } else if (this.state == "EmeraldChase") {
            const linkedEmerald = EntityStore.getLinkedEntity(this.entity!, "emeraldLinkId");
            if (!linkedEmerald) return this.tryResetState();

            const linkedTarget = EntityStore.getLinkedEntity(this.entity!, "targetLinkId");
            if (!linkedTarget) return this.tryResetState();
        } else if (this.state == "BossFight") {
            const distanceToLinkedTarget = this.getDistanceToTarget();
            if (distanceToLinkedTarget > GameData.ShrineDeactivationDistance) {
                const nearestPlayer = EntityUtil.getNearestPlayer(this.entity!.location, this.entity!.dimension, 30);
                if (nearestPlayer && !EntityStore.get(nearestPlayer, "completedShrineIds").includes(this.entity!.id)) {
                    this.syncEmeraldTo(nearestPlayer);
                } else return this.tryResetState();
            }

            if (EntityStore.isLinkedEntitySet(this.entity!, "eggmanLinkId")) {
                const linkedEggman = EntityStore.getLinkedEntity(this.entity!, "eggmanLinkId");
                if (!linkedEggman) return this.tryResetState();
            } else {
                if (!this.isEggrobosNearby()) {
                    const eggman = EntityUtil.spawnEntity(
                        "gm1_ord:eggman",
                        new V3(this.entity!.location.x, this.entity!.location.y - 3, this.entity!.location.z),
                        this.entity!.dimension
                    );
                    EntityStore.linkEntities(this.entity!, eggman, "eggmanLinkId");
                }
            }
        }
    }

    tryUnlinkPlayerFromOtherShrine(player: Player, forceUnlinkIfOtherShineIsPreEmeraldChase = false) {
        const isLinkedToOtherShrine = EntityStore.isLinkedEntitySet(player, "targetLinkId");
        if (!isLinkedToOtherShrine) return; // Not linked to any shrine, skip

        const linkedShrine = EntityStore.getLinkedEntity(player, "targetLinkId");
        if (!linkedShrine) {
            return EntityStore.resetLink(player, "targetLinkId"); // Linked to a non-existing shrine, unlink
        }

        if (linkedShrine.id == this.entity!.id) return; // Linked to this shrine, skip

        if (forceUnlinkIfOtherShineIsPreEmeraldChase) {
            if (MobComponentManager.getInstanceOfComponent(ShrineMarker, linkedShrine)?.state == "PreEmeraldChase") {
                return EntityStore.resetLink(player, "targetLinkId"); // Linked to a PreEmeraldChase shrine, unlink
            }
        }

        const distanceToLinkedShrine = V3.distance(player.location, linkedShrine.location);
        if (distanceToLinkedShrine > 64) {
            return EntityStore.resetLink(player, "targetLinkId"); // Linked to a far shrine, unlink
        }
    }

    /* When player approach to the shrine (but not very close to) (within 64 blocks),
     * and the shrine is "Offline", link the shrine with player (targetLinkId) and set the Emerald type,
     * update state "Offline" --> "BossFight"
     *              "Offline" --> "PreEmeraldChase" -(next)-> "EmeraldChase"
     */
    onPlayerNearbyFar(player: Player) {
        if (this.state !== "Offline") return;
        if (EntityStore.get(player, "completedShrineIds").includes(this.entity!.id)) return;

        this.tryUnlinkPlayerFromOtherShrine(player);

        const currentLinkedShrine = EntityStore.getLinkedEntity(player, "targetLinkId");
        if (currentLinkedShrine && currentLinkedShrine.id !== this.entity!.id) {
            // console.warn(`Player ${player.id} is already linked to shrine ${currentLinkedShrine}, resetting shrine ${this.entity!.id}.`);
            this.setState("Offline");
            return;
        }

        this.syncEmeraldTo(player);
        if (this.staticState == "BossFight") this.setState("BossFight");
        if (this.staticState == "EmeraldChase") this.setState("PreEmeraldChase");
    }

    /* When player is very close to the shrine (controled by gm1_ord:on_player_close),
     * and the shrine is "Offline" and "PreEmeraldChase", link the shrine with player and set the Emerald type,
     * update state "Offline" --> "PreEmeraldChase" -(now)-> "EmeraldChase"
     */
    onPlayerNearbyClose(player: Player) {
        if (this.state !== "Offline" && this.state !== "PreEmeraldChase") return;
        if (EntityStore.get(player, "completedShrineIds").includes(this.entity!.id)) return;

        this.tryUnlinkPlayerFromOtherShrine(player, true);

        const currentLinkedShrine = EntityStore.getLinkedEntity(player, "targetLinkId");
        if (currentLinkedShrine && currentLinkedShrine.id !== this.entity!.id) {
            // console.warn(`Player ${player.id} is already linked to shrine ${currentLinkedShrine}, resetting shrine ${this.entity!.id}.`);
            this.setState("Offline");
            return;
        }

        this.syncEmeraldTo(player);
        if (this.staticState == "EmeraldChase") this.setState("EmeraldChase");
    }

    /* If the player kill the Eggman and the shrine is in "BossFight" status,
     * get the linked player of this shrine (targetLinkId),
     * get the linked emerald (bossEmeraldLinkId), set lock --> unlock
     * link the player and the unlocked emerald with new connection (emeraldLinkId)
     * break the old link (bossEmeraldLinkId) (targetLinkId) (bossEmeraldLinkId)
     */
    onLinkedEggmanDestroyed() {
        if (this.state !== "BossFight") return;

        const target = EntityStore.getLinkedEntity(this.entity!, "targetLinkId") as Player;
        if (target) {
            EntityStore.pushToArray(target, "completedShrineIds", this.entity!.id);
            ChaosEmerald.GivePlayerEmerald(target);

            const emerald = EntityStore.getLinkedEntity(this.entity!, "bossEmeraldLinkId");
            if (emerald) {
                MobComponentManager.getInstanceOfComponent(ChaosEmerald, emerald).setType("unlocked");
                EntityStore.linkEntities(target, emerald, "emeraldLinkId");
                EntityStore.resetLink(this.entity!, "bossEmeraldLinkId");
            }
        }

        this.syncEmeraldTo(undefined);
        this.setState("Offline");
        EntityStore.resetLink(this.entity!, "eggmanLinkId");
    }

    // If the shrine in an invalid state for 5 consecutive ticks, reset the shrine
    tryResetState() {
        this.resetTimeCount++;
        if (this.resetTimeCount < 5) return;

        this.syncEmeraldTo(undefined);
        this.setState("Offline");
        this.resetTimeCount = 0;
    }

    setState(newState: "Offline" | "PreEmeraldChase" | "EmeraldChase" | "BossFight") {
        if (this.state == newState) return;
        WorldStore.force.set(`Shrine_State_${this.entity!.id}`, newState);
        this.state = newState;
        this.resetTimeCount = 0;

        if (newState == "BossFight") {
            this.trySpawnEggrobos();
            const linkedEmerald = EntityStore.getLinkedEntity(this.entity!, "emeraldLinkId");

            if (!linkedEmerald && this.shrineType !== undefined) {
                const emerald = EntityUtil.spawnEntity(
                    `${EmeraldEntityIDs[this.shrineType]}<gm1_ord:locked_eggman>`,
                    this.entity!.location,
                    this.entity!.dimension
                );
                EntityStore.linkEntities(this.entity!, emerald, "bossEmeraldLinkId");
            }
        } else if (newState == "PreEmeraldChase") {
            if (this.shrineType !== undefined) {
                const emerald = this.entity!.dimension.spawnEntity(
                    `${EmeraldEntityIDs[this.shrineType]}<gm1_ord:locked>}`,
                    this.entity!.location
                );
                EntityStore.linkEntities(this.entity!, emerald, "emeraldLinkId");
            }
        } else if (newState == "EmeraldChase") {
            if (this.shrineType !== undefined) {
                const emerald = EntityStore.getLinkedEntity(this.entity!, "emeraldLinkId");
                if (emerald) {
                    this.timeout(() => MobComponentManager.getInstanceOfComponent(ChaosEmerald, emerald).setType("moving"), 1);
                }
            }
        } else if (newState == "Offline") {
            // EntityStore.getLinkedEntity(this.entity!, "eggmanLinkId")?.remove();
            EntityStore.resetLink(this.entity!, "eggmanLinkId");

            // EntityStore.getLinkedEntity(this.entity!, "bossEmeraldLinkId")?.remove();
            EntityStore.resetLink(this.entity!, "bossEmeraldLinkId");

            const emerald = EntityStore.getLinkedEntity(this.entity!, "emeraldLinkId");
            if (emerald) {
                const emeraldComp = MobComponentManager.getInstanceOfComponent(ChaosEmerald, emerald);
                if (!emeraldComp || emeraldComp.type !== "unlocked") emerald.remove();
            }
            EntityStore.resetLink(this.entity!, "emeraldLinkId");

            this.entity!.setProperty("gm1_ord:player_range_state", "none");
        }
    }

    /* If player nearby, bind the shrine with player and set the Emerald type
     * otherwise break the current shrine link with any player
     */
    syncEmeraldTo(playerNearby: Player | undefined) {
        if (playerNearby) {
            EntityStore.linkEntities(this.entity!, playerNearby, "targetLinkId");
            const emeraldStage = EntityStore.get(playerNearby, "EmeraldStage");
            this.shrineType = emeraldStage;
        } else {
            this.shrineType = undefined;
            EntityStore.resetLink(this.entity!, "targetLinkId");
        }
    }

    isEggrobosNearby() {
        const eggrobosNearby = this.entity!.dimension.getEntities({
            location: this.entity!.location,
            maxDistance: GameData.ShrineEggroboRadius + 3,
            type: "gm1_ord:badnik_eggrobo",
        });
        return eggrobosNearby.length > 0;
    }

    getDistanceToTarget() {
        const linkedTarget = EntityStore.getLinkedEntity(this.entity!, "targetLinkId");
        if (!linkedTarget) return Infinity;
        return V3.distance(this.entity!.location, linkedTarget.location);
    }

    trySpawnEggrobos() {
        if (this.isEggrobosNearby()) return;

        const shrinePos = new V3(this.entity!.location);
        const radiansPerI = (Math.PI * 2) / GameData.ShrineEggroboCount;
        for (let i = 0; i < GameData.ShrineEggroboCount; i++) {
            const roboPosOffset = V3.fromYaw(i * radiansPerI).multiply(GameData.ShrineEggroboRadius);
            roboPosOffset.y = GameData.ShrineEggroboAltitude;
            this.entity!.dimension.spawnEntity("gm1_ord:badnik_eggrobo", shrinePos.addV3(roboPosOffset));
        }
    }
}
