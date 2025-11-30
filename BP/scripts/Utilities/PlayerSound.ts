import { Player, PlayerSoundOptions } from "@minecraft/server";

export default class PlayerSound {
    constructor(
        public name: string,
        private options?: PlayerSoundOptions
    ) {}

    play(players: Player | Player[], options?: PlayerSoundOptions) {
        // merge the options, with the options passed in taking priority.
        const optionsToUse = { ...this.options, ...options };

        if (players instanceof Player) players.playSound(this.name, optionsToUse);
        else players.forEach((player) => player.playSound(this.name, optionsToUse));
    }
}
