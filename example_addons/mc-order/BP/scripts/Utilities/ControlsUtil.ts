import { HudElement, Player } from "@minecraft/server";

export default class ControlsUtil {
    /**
     * Disables the camera and movement controls for the specified player.
     *
     * @param player - The player whose controls will be locked.
     */
    static lockControls(player: Player) {
        player.inputPermissions.cameraEnabled = false;
        player.inputPermissions.movementEnabled = false;
    }

    /**
     * Unlocks the controls for the specified player.
     *
     * @param player - The player whose controls will be unlocked.
     */
    static unlockControls(player: Player) {
        player.inputPermissions.cameraEnabled = true;
        player.inputPermissions.movementEnabled = true;
    }

    /**
     * Hides all HUD elements for a given player except the specified elements.
     *
     * @param player - The player whose HUD elements will be modified.
     * @param element - An optional array of HUD elements that should remain visible. Defaults to an empty array.
     */
    static hideHudElementsExcept(player: Player, element: HudElement[] = []) {
        player.onScreenDisplay.hideAllExcept(element);
    }

    /**
     * Displays the HUD for the specified player by resetting the HUD elements.
     *
     * @param player - The player for whom the HUD should be displayed.
     */
    static showHUD(player: Player) {
        player.onScreenDisplay.resetHudElements();
    }

    /**
     * Sets the visibility of specified HUD elements for a player.
     *
     * @param player - The player whose HUD elements' visibility is to be set.
     * @param element - An array of HUD elements to change visibility for.
     * @param visible - The visibility state to set for the specified HUD elements. True is visible, false is hidden.
     */
    static hudElementVisbility(player: Player, element: HudElement[], visible: boolean) {
        const visibilityState = visible ? 1 : 0;
        player.onScreenDisplay.setHudVisibility(visibilityState, element);
    }

    /**
     * Retrieves the hidden HUD elements for a given player.
     *
     * @param player - The player whose hidden HUD elements are to be retrieved.
     * @returns An array of hidden HUD elements for the specified player.
     */
    static getHiddenElements(player: Player) {
        return player.onScreenDisplay.getHiddenHudElements();
    }
}
