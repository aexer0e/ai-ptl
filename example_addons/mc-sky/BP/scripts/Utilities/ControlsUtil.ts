import { Player } from "@minecraft/server";

export default class ControlsUtil {
    static lockControls(player: Player) {
        player.runCommand("inputpermission set @s camera disabled");
        player.runCommand("inputpermission set @s movement disabled");
    }

    static unlockControls(player: Player) {
        player.runCommand("inputpermission set @s camera enabled");
        player.runCommand("inputpermission set @s movement enabled");
    }

    static hideHUD(player: Player) {
        player.runCommand("hud @s hide all");
    }

    static showHUD(player: Player) {
        player.runCommand("hud @s reset all");
    }
}
