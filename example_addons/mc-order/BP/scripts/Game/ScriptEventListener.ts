import { Player, ScriptEventCommandMessageAfterEvent, system, world } from "@minecraft/server";
import SoundData from "Game/Sound/SoundData";
import MobComponentManager from "MobComponents/MobComponentManager";
import ChaosEmerald from "MobComponents/MobComponents/ChaosEmerald";
import IntroBook from "MobComponents/MobComponents/IntroBook";
import PlayerMovement from "MobComponents/MobComponents/PlayerMovement";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import EventUtil from "Utilities/EventUtil";
import Runner from "Utilities/Runner";
import V3 from "Wrappers/V3";
import ConfigurableMenu from "./ConfigurableMenu";
import GameData from "./GameData";

/**
 * ScriptEventListener class to handle script events for game logic.
 * Use Dev/ScriptEventListener for dev testing script events.
 */
export default class ScriptEventListener {
    /**
     * Initializes the event listener by subscribing to the script event receive.
     */
    static init() {
        EventUtil.subscribe("SystemAfterEvents", "scriptEventReceive", this.onScriptEventReceive.bind(this));
    }

    /**
     * Handles the script event receive.
     * @param event The event data received.
     */
    static onScriptEventReceive(eventData: ScriptEventCommandMessageAfterEvent) {
        const message = eventData.message;
        const player = (eventData.sourceEntity || eventData.initiator) as Player;
        switch (eventData.id) {
            case "gm1_ord:tp_to_spawn": {
                // Cancel momentum
                const moveComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, player);
                moveComp.momentum = GameData.MinMomentum;
                moveComp.verticalKnockback = 0.0;

                // Do teleport
                const spawn = player.getSpawnPoint();
                const playerDim = player.dimension;
                if (spawn && playerDim == spawn.dimension) {
                    const realSpawn = { x: spawn.x, y: spawn.y, z: spawn.z };
                    player.teleport(realSpawn);
                    Runner.timeout(() => {
                        SoundData.feature.mega_ring.play(player);
                    }, 1);
                } else if (spawn === undefined && playerDim === world.getDimension("overworld")) {
                    const originalLoc = new V3(player.location);
                    function tpPlayerToTopmostBlock(x: number, z: number, isFirstAttempt = true, order = 0) {
                        const topBlock = playerDim.getTopmostBlock({ x: x, z: z });
                        if (!topBlock || !topBlock.isValid()) {
                            if (order >= 60 /* unable to get top block after 3 seconds */) {
                                console.warn(`Failed to find topmost block for player ${player.name} after 10 attempts.`);
                                player.teleport(originalLoc);
                                return;
                            }
                            system.runTimeout(() => {
                                tpPlayerToTopmostBlock(x, z, false, order + 1);
                            }, 2);
                            if (isFirstAttempt) player.teleport(new V3(x, 1000, z));
                            return;
                        }
                        const topLocation = new V3(topBlock.x, topBlock.y + 1, topBlock.z);
                        player.teleport(topLocation);
                        return true;
                    }
                    const spawnLoc = world.getDefaultSpawnLocation();
                    tpPlayerToTopmostBlock(spawnLoc.x, spawnLoc.z);
                }
                break;
            }
            case "gm1_ord:set_onboarding_book": {
                const validIconStates = [
                    "main_page",
                    "settings_page",
                    "credits_page",
                    "changelog_page",
                    "crafting_page1",
                    "crafting_page2",
                    "crafting_page3",
                    "crafting_page4",
                    "crafting_page5",
                    "crafting_page6",
                    "crafting_page7",
                    "crafting_page8",
                    "crafting_page9",
                    "crafting_page10",
                    "crafting_page11",
                    "intro_page0",
                    "intro_page1",
                    "intro_page2",
                    "intro_page3",
                    "intro_page4",
                    "character_sonic",
                    "character_tails",
                    "character_knuckles",
                    "character_amy",
                    "character_shadow",
                    "quest_super_shadow",
                    "quest_super_sonic",
                    "quest_eggman",
                    "quest_chaos_machine",
                    "quest_emerald0",
                    "quest_emerald1",
                    "quest_emerald2",
                    "quest_emerald3",
                    "quest_emerald4",
                    "quest_emerald5",
                    "quest_emerald6",
                    "quest_emerald7",
                    "crafting_page12",
                    "crafting_page13",
                ];
                if (!validIconStates.includes(message)) {
                    return console.warn(`Invalid icon state ${message}. Valid states are: ${validIconStates.join(", ")}`);
                }
                player.setProperty("gm1_ord:page_number", validIconStates.indexOf(message));
                break;
            }
            case "gm1_ord:intro_book_try_open": {
                const player = eventData.sourceEntity;

                if (!player) return;

                const Component = MobComponentManager.getInstanceOfComponent(IntroBook, player);

                if (Component) {
                    Component.isBookOpen = true;
                }
                break;
            }
            case "gm1_ord:intro_book_try_close": {
                const player = eventData.sourceEntity;

                if (!player) return;

                const Component = MobComponentManager.getInstanceOfComponent(IntroBook, player);

                if (Component) {
                    Component.isBookOpen = false;
                    Runner.timeout(() => {
                        if (!Component.isBookOpen) Component.closeIntroBook();
                    }, 1);
                }
                break;
            }
            case "gm1_ord:spring_trigger":
                {
                    const spring = eventData.sourceEntity;
                    const springer = spring?.dimension.getEntities({
                        location: spring.location,
                        closest: 1,
                        excludeTypes: ["gm1_ord:lf_spring_yellow", "gm1_ord:lf_spring_red", "minecraft:item"],
                    })[0];

                    let springStrength = 0;

                    if (spring?.typeId === "gm1_ord:lf_spring_yellow") {
                        springStrength = 1.25; // Default spring
                    } // Check if the spring is red
                    if (spring?.typeId === "gm1_ord:lf_spring_red") {
                        springStrength = 1.7; // Red spring boost
                    }
                    springer?.applyKnockback(0, 0, 0, springStrength);
                }
                break;
            case "gm1_ord:max_emeralds":
                {
                    EntityStore.set(player, "EmeraldStage", 7);
                    world.scoreboard.getObjective("gm1_ord:collected_emeralds")?.setScore(player, 7);
                }
                break;
            case "gm1_ord:no_emeralds":
                {
                    EntityStore.set(player, "EmeraldStage", 0);
                    world.scoreboard.getObjective("gm1_ord:collected_emeralds")?.setScore(player, 0);
                }
                break;
            case "gm1_ord:add_emerald":
                {
                    ChaosEmerald.GivePlayerEmerald(player);
                }
                break;
            case "gm1_ord:remove_emerald":
                {
                    const currentEmeraldStage = EntityStore.get(player, "EmeraldStage");
                    EntityStore.set(player, "EmeraldStage", Math.max(0, currentEmeraldStage - 1));
                    world.scoreboard.getObjective("gm1_ord:collected_emeralds")?.setScore(player, Math.max(0, currentEmeraldStage - 1));
                }
                break;
            case "gm1_ord:open_configurable_menu":
                {
                    // In this case, player Entity is book, we need to get user of the book which stored in EntityStore
                    const realPlayer = EntityUtil.getPlayerById(EntityStore.get(player, "bookUserId"))!;
                    ConfigurableMenu.open(realPlayer);
                }
                break;
        }
    }
}
