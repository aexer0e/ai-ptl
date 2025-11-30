import { Player, RawMessage, TitleDisplayOptions, world } from "@minecraft/server";
import { Maybe } from "Types/GenericTypes";
import { Message } from "../Types/Message";

class _BroadcastUtil {
    /**
     * Sends a message to the specified players or to all players in the world.
     *
     * @param message - The message to be sent, supports a string or raw message.
     * @param players - An optional array of players to send the message to. If not provided, the message will be sent to all players in the world.
     */
    static say(message: Message, players: Maybe<Player[]> = null) {
        if (players === null) world.sendMessage(message);
        else {
            for (const player of players) {
                player.sendMessage(message);
            }
        }
    }

    /**
     * Translates a localization key into a message and broadcasts it to specified players.
     *
     * @param locKey - The localization key to translate.
     * @param translateWith - An optional array of strings or raw messages to be used as translation parameters.
     * @param players - An optional array of players to broadcast the translated message to.
     * @param prefixFormatting - An optional string to be used as a prefix formatting for the translated message.
     */
    static translate(
        locKey: string,
        translateWith: Maybe<(string | RawMessage)[]> = null,
        players: Maybe<Player[]> = null,
        prefixFormatting: Maybe<string> = null
    ) {
        const mapTranslateWithItem = (item: string | RawMessage) => {
            if (typeof item === "string") {
                return { text: item };
            } else if (item && typeof item === "object") {
                return item;
            } else {
                console.warn("Invalid item type in translateWith array:", item);
                return { text: String(item) };
            }
        };
        const mappedTranslateWith = translateWith ? translateWith.map(mapTranslateWithItem) : undefined;
        const message: Message = {
            rawtext: [
                {
                    text: prefixFormatting ? prefixFormatting : "",
                },
                {
                    translate: locKey,
                    with: translateWith
                        ? {
                              rawtext: mappedTranslateWith,
                          }
                        : undefined,
                },
            ],
        };
        this.say(message, players);
    }

    static clipboard(message: string) {
        console.log("clipboard-start" + message + "clipboard-end");
    }

    static foliageData(message: string) {
        console.log("foliagedata-start" + message + "foliagedata-end");
    }

    static nodeData(message: string) {
        console.log("nodedata-start" + message + "nodedata-end");
    }

    /**
     * Logs a debug message.
     * @param message - The message to be logged.
     * @remarks The players needs the "dev" tag to see the message.
     */
    static debug(message: string) {
        DebugTimer.countStart("BroadcastUtil.debug");
        this.say(
            `§2>§r ${message}`,
            world.getPlayers().filter((player) => player.hasTag("dev"))
        );
        DebugTimer.countEnd();
    }

    static debugSystem(systemId: "DragonInteractions", message: string) {
        if (Config.get("Debug: Dragon Interactions")) {
            this.say(`§2${systemId}§r > ${message}`);
        }
    }

    /**
     * Sets the action bar message for the specified players.
     * If no players are provided, the action bar message will be set for all players in the world.
     * @param message - The message to be displayed on the action bar.
     * @param players - An optional array of players to set the action bar message for. If not provided, the message will be set for all players in the world.
     */
    static actionbar(message: Message, players: Maybe<Player[]> = null) {
        DebugTimer.countStart("BroadcastUtil.actionbar");
        if (players === null) players = world.getPlayers();
        for (const player of players) player.onScreenDisplay.setActionBar(message);
        DebugTimer.countEnd();
    }

    /**
     * Sets the title message for the specified players.
     *
     * @param message - The message to display as the title.
     * @param players - The players to display the title to. If not provided, all players in the world will be used.
     * @param options - The options for displaying the title. If not provided, default options will be used.
     */
    static title(message: Message, players: Maybe<Player[]> = null, options: TitleDisplayOptions | undefined = undefined) {
        DebugTimer.countStart("BroadcastUtil.title");
        if (players === null) players = world.getPlayers();
        for (const player of players) player.onScreenDisplay.setTitle(message, options);
        DebugTimer.countEnd();
    }

    /**
     * Displays a subtitle message to the specified players or all players in the world.
     *
     * @param message - The message to display as a subtitle.
     * @param players - (Optional) The players to display the subtitle to. If not provided, the subtitle will be displayed to all players in the world.
     */
    static subtitle(message: Message, players: Maybe<Player[]> = null) {
        DebugTimer.countStart("BroadcastUtil.subtitle");
        if (players === null) players = world.getPlayers();
        for (const player of players) player.onScreenDisplay.updateSubtitle(message);
        DebugTimer.countEnd();
    }

    /**
     * Converts the given number of seconds to a colon-separated time format.
     *
     * @param seconds - The number of seconds to convert.
     * @returns The time in the format "MM:SS".
     */
    public static convertSecondsToColonTime(seconds: number) {
        const minutes = Math.floor(seconds / 60).toString();
        const secondsLeft = Math.floor(seconds % 60).toString();
        return `${minutes.padStart(2, "0")}:${secondsLeft.padStart(2, "0")}`;
    }

    /**
     * Converts the given number of seconds to a string representation in the format "mm:ss.SS".
     * @param seconds - The number of seconds to convert.
     * @returns A string representation of the time in the format "mm:ss.SS".
     */
    static convertSecondsToColonTimeWithMilliseconds(seconds: number) {
        // 2 digits after decimal point
        const minutes = Math.floor(seconds / 60).toString();
        const secondsLeft = Math.floor(seconds % 60).toString();
        const milliseconds = Math.round((seconds % 1) * 100).toString();
        return `${minutes.padStart(2, "0")}:${secondsLeft.padStart(2, "0")}.${milliseconds.padStart(2, "0")}`;
    }

    /**
     * Converts the given number of ticks to a colon-separated time format.
     *
     * @param ticks The number of ticks to convert.
     * @returns The converted time in the format HH:MM:SS.
     */
    static convertTicksToColonTime(ticks: number) {
        return this.convertSecondsToColonTime(Math.round(ticks / 20));
    }
}

declare global {
    // eslint-disable-next-line no-var
    var BroadcastUtil: Omit<typeof _BroadcastUtil, "prototype">;
}
globalThis.BroadcastUtil = _BroadcastUtil;
