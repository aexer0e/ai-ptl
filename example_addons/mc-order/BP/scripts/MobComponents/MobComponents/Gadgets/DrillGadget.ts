import { Entity, system } from "@minecraft/server";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import V3 from "Wrappers/V3";
import Gadget from "./Gadget";

export default class DrillGadget extends Gadget {
    readonly hitbox: "sides" | "above" | "below" | "behind" = "sides";
    readonly gadgetId = 3;
    readonly canDestroyBlocks = true;
    readonly spawnInvulnerable = true;

    readonly ShootDrillsCooldown = 240; // The duration to wait before shooting drills again
    readonly ShootDrillsInterval = 20; // The interval between each drill shot
    readonly RechargeDrillsDuration = 120; // The time it takes to recharge the drills after shooting the second drill
    static readonly DrillSpeed = 0.4; // The speed of the drill
    static readonly DrillDamage = 4; // The amount of damage the drill deals when it hits a player
    static readonly DrillKnockback = 0.8; // The amount of knockback the drill deals when it hits a player
    static readonly DrillMaxLifetime = 7 * 20; // The speed of the drill
    static readonly DrillMaxBlocksToDestroy = 40; // The maximum number of blocks to destroy

    action: "shooting_drills" | null = null;

    init() {
        this.entity.setProperty("gm1_ord:is_shooting_drills", false);
    }

    process() {
        if (system.currentTick % this.ShootDrillsCooldown === 0) {
            const nearestPlayer = this.eggmanComponent.getNearestPlayer();
            this.shootDrills(nearestPlayer!);
        }
    }

    shootDrills(player: Entity) {
        const interval = this.ShootDrillsInterval;
        this.setActionVariable("shooting_drills");

        const viewDirection = new V3(this.entity.getViewDirection());
        const left = viewDirection.cross(new V3(0, -1, 0));

        const drill1Location = new V3(this.entity.location).addV3(viewDirection.multiply(3)).addV3(left.multiply(2)).addY(0.5);
        const drill2Location = new V3(this.entity.location).addV3(viewDirection.multiply(3)).addV3(left.multiply(-2)).addY(0.5);

        this.shootDrill(player, drill1Location);

        this.timeout(() => {
            this.shootDrill(player, drill2Location);
            this.setActionVariable(null);
        }, interval);
    }

    shootDrill(player: Entity, spawnLocation: V3) {
        const drill = EntityUtil.spawnEntity("gm1_ord:drill", spawnLocation, this.entity.dimension);

        const viewDirection = new V3(this.entity.getViewDirection());
        drill.setRotation(viewDirection.asRotation());

        const playerLocation = new V3(player.location).addY(0.8);
        EntityStore.temporary.set(drill, "targetLocation", playerLocation);
    }

    private actionVariableRunnerId: number | null = null;
    private setActionVariable(action: DrillGadget["action"], delay = 0, onlyFromState?: DrillGadget["action"]) {
        if (onlyFromState && this.action !== onlyFromState) return;

        if (this.actionVariableRunnerId !== null) system.clearRun(this.actionVariableRunnerId);

        if (delay) {
            this.actionVariableRunnerId = system.runTimeout(() => {
                this.action = action;
            }, delay);
        } else {
            this.action = action;
        }
    }
}
