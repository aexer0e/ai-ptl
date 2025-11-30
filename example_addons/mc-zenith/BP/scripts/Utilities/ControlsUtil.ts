import { InputPermissionCategory, Player } from "@minecraft/server";

class _ControlsUtil {
    static lockControls(player: Player) {
        this.lockCamera(player);
        this.lockMovement(player);
    }

    static unlockControls(player: Player) {
        this.unlockCamera(player);
        this.unlockMovement(player);
    }

    static lockCamera(player: Player) {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, false);
    }

    static unlockCamera(player: Player) {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, true);
    }

    static lockMovement(player: Player) {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
    }

    static unlockMovement(player: Player) {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.LateralMovement, true);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Mount, true);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Sneak, true);
    }

    static hideHUD(player: Player) {
        player.runCommand("hud @s hide all");
    }

    static showHUD(player: Player) {
        player.runCommand("hud @s reset all");
    }
}

declare global {
    // eslint-disable-next-line no-var
    var ControlsUtil: Omit<typeof _ControlsUtil, "prototype">;
}
globalThis.ControlsUtil = _ControlsUtil;
