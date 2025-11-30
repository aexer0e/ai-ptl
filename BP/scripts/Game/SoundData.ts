import PlayerSound from "../Utilities/PlayerSound";

export default class SoundData {
    static parkour = {
        start: new PlayerSound("parkour_start"),
        leave: new PlayerSound("parkour_leave"),
        die: new PlayerSound("parkour_fall"),
        step: new PlayerSound("parkour_step", { pitch: 1.5 }),
        win: new PlayerSound("parkour_finish"),
        checkpoint: new PlayerSound("parkour_checkpoint"),
    };
}
