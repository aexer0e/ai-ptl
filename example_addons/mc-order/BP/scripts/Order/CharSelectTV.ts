import { ItemStack, Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import InventoryUtil from "Utilities/InventoryUtil";

export default class CharSelectTV {
    static PRICES = [
        128, //Sonic
        32, //Tails
        256, //Knuckles
        64, //Amy
        512, //Shadow
    ];
    static ITEMS = ["gm1_ord:sonic_life", "gm1_ord:tails_life", "gm1_ord:knuckles_life", "gm1_ord:amy_life", "gm1_ord:shadow_life"];

    static init() {
        world.beforeEvents.worldInitialize.subscribe((initEvent) => {
            initEvent.blockComponentRegistry.registerCustomComponent("gm1_ord:char_select_tv_interact", {
                onPlayerInteract: (e) => {
                    const player = e.player;
                    if (player instanceof Player) {
                        const form = new ActionFormData();
                        form.title({ translate: "gm1_ord.character_tv.title" });
                        form.body({ translate: "gm1_ord.character_tv.body" });
                        form.button(
                            {
                                rawtext: [
                                    { translate: "gm1_ord.character_tv.button.sonic.line.1" },
                                    { text: "\n" },
                                    { translate: "gm1_ord.character_tv.button.sonic.line.2", with: [`${this.PRICES[0]}`] },
                                ],
                            },
                            "textures/gm1/ord/items/gm1_sonic_token"
                        );
                        form.button(
                            {
                                rawtext: [
                                    { translate: "gm1_ord.character_tv.button.tails.line.1" },
                                    { text: "\n" },
                                    { translate: "gm1_ord.character_tv.button.tails.line.2", with: [`${this.PRICES[1]}`] },
                                ],
                            },
                            "textures/gm1/ord/items/gm1_tails_token"
                        );
                        form.button(
                            {
                                rawtext: [
                                    { translate: "gm1_ord.character_tv.button.knuckles.line.1" },
                                    { text: "\n" },
                                    { translate: "gm1_ord.character_tv.button.knuckles.line.2", with: [`${this.PRICES[2]}`] },
                                ],
                            },
                            "textures/gm1/ord/items/gm1_knuckles_token"
                        );
                        form.button(
                            {
                                rawtext: [
                                    { translate: "gm1_ord.character_tv.button.amy.line.1" },
                                    { text: "\n" },
                                    { translate: "gm1_ord.character_tv.button.amy.line.2", with: [`${this.PRICES[3]}`] },
                                ],
                            },
                            "textures/gm1/ord/items/gm1_amy_token"
                        );
                        form.button(
                            {
                                rawtext: [
                                    { translate: "gm1_ord.character_tv.button.shadow.line.1" },
                                    { text: "\n" },
                                    { translate: "gm1_ord.character_tv.button.shadow.line.2", with: [`${this.PRICES[4]}`] },
                                ],
                            },
                            "textures/gm1/ord/items/gm1_shadow_token"
                        );

                        form.show(player)
                            .then((response) => {
                                const selection = response.selection;
                                if (selection != undefined) {
                                    const ring_count = InventoryUtil.getItemCount(player, new ItemStack("gm1_ord:ring_spawn_egg", 1));
                                    const cost = this.PRICES[selection];
                                    if (ring_count >= cost) {
                                        for (let i = 0; i < cost; i++) {
                                            InventoryUtil.clearItem(player, new ItemStack("gm1_ord:ring_spawn_egg", 1));
                                        }
                                        player.runCommand("playsound purchase_success @a ~~~");
                                        player.dimension.spawnItem(new ItemStack(this.ITEMS[selection], 1), player.location);
                                    } else {
                                        player.sendMessage({ translate: "gm1_ord.character_tv.ring_warning" });
                                        player.runCommand("playsound insufficient_rings @a ~~~");
                                    }
                                }
                            })
                            .catch((e) => {
                                console.error(e, e.stack);
                            });
                    }
                },
            });
        });
    }
}
