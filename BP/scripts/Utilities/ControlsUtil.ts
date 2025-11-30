import { InputPermissionCategory, Player } from "@minecraft/server";

class _ControlsUtil {
    static lockControls(player: Player) {
        this.lockInputPermission(player, InputPermissionCategory.Camera);
        this.lockInputPermission(player, InputPermissionCategory.Movement);
    }

    static unlockControls(player: Player) {
        this.unlockInputPermission(player, InputPermissionCategory.Camera);
        this.unlockInputPermission(player, InputPermissionCategory.Movement);
    }

    static lockInputPermission(player: Player, category: InputPermissionCategory) {
        player.inputPermissions.setPermissionCategory(category, false);
    }

    static unlockInputPermission(player: Player, category: InputPermissionCategory) {
        player.inputPermissions.setPermissionCategory(category, true);
    }

    static hideHUD(player: Player) {
        player.onScreenDisplay.hideAllExcept();
    }

    static showHUD(player: Player) {
        player.onScreenDisplay.resetHudElementsVisibility();
    }
}

declare global {
    // eslint-disable-next-line no-var
    var ControlsUtil: Omit<typeof _ControlsUtil, "prototype">;
}
globalThis.ControlsUtil = _ControlsUtil;
