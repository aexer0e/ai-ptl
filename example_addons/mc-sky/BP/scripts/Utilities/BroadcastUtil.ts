import { Player, RawMessage, TitleDisplayOptions, world } from "@minecraft/server";
import { Maybe } from "Types/Maybe";
import { Message } from "../Types/Message";

export default class BroadcastUtil {
    static say(message: Message, players: Maybe<Player[]> = null) {
        if (players === null) world.sendMessage(message);
        else {
            for (const player of players) {
                player.sendMessage(message);
            }
        }
    }

    static translate(
        locKey: string,
        translateWith: Maybe<(string | RawMessage)[]> = null,
        players: Maybe<Player[]> = null,
        prefixFormatting: Maybe<string> = null
    ) {
        const message: Message = {
            rawtext: [
                {
                    text: prefixFormatting ? prefixFormatting : "",
                },
                {
                    translate: locKey,
                    with: translateWith
                        ? {
                              rawtext: translateWith.map((item: string | RawMessage) => {
                                  if (typeof item === "string") {
                                      return { text: item };
                                  } else if (item && typeof item === "object") {
                                      return item;
                                  } else {
                                      console.warn("Invalid item type in translateWith array:", item);
                                      return { text: String(item) };
                                  }
                              }),
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

    static nodeData(message: string) {
        console.log("nodedata-start" + message + "nodedata-end");
    }

    static debug(message: string) {
        this.say(
            `§2>§r ${message}`,
            world.getPlayers().filter((player) => player.hasTag("dev"))
        );
    }

    static actionbar(message: Message, players: Maybe<Player[]> = null) {
        if (players === null) players = world.getPlayers();
        for (const player of players) player.onScreenDisplay.setActionBar(message);
    }

    static title(message: Message, players: Maybe<Player[]> = null, options: TitleDisplayOptions | undefined = undefined) {
        if (players === null) players = world.getPlayers();
        for (const player of players) player.onScreenDisplay.setTitle(message, options);
    }

    static subtitle(message: Message, players: Maybe<Player[]> = null) {
        if (players === null) players = world.getPlayers();
        for (const player of players) player.onScreenDisplay.updateSubtitle(message);
    }

    public static convertSecondsToColonTime(seconds: number) {
        const minutes = Math.floor(seconds / 60).toString();
        const secondsLeft = Math.floor(seconds % 60).toString();
        return `${minutes.padStart(2, "0")}:${secondsLeft.padStart(2, "0")}`;
    }

    static convertSecondsToColonTimeWithMilliseconds(seconds: number) {
        // 2 digits after decimal point
        const minutes = Math.floor(seconds / 60).toString();
        const secondsLeft = Math.floor(seconds % 60).toString();
        const milliseconds = Math.round((seconds % 1) * 100).toString();
        return `${minutes.padStart(2, "0")}:${secondsLeft.padStart(2, "0")}.${milliseconds.padStart(2, "0")}`;
    }

    static convertTicksToColonTime(ticks: number) {
        return this.convertSecondsToColonTime(Math.round(ticks / 20));
    }
}
