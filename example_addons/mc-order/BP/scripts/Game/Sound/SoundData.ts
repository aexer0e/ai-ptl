import PlayerSound from "./PlayerSound";

/* 
    This is a collection of all the sounds used in the game. 
    World sounds are played at a location, player sounds are played to a player.
*/
export default class SoundData {
    static readonly enemy = {
        death: new PlayerSound("tv_death"),
    };

    static readonly feature = {
        dash_panel: new PlayerSound("feature_dash_panel"),
        jump_panel: new PlayerSound("feature_jump_panel"),
        mega_ring: new PlayerSound("feature_mega_ring"),
    };

    static readonly game_rule = {
        mob_griefing_disable: new PlayerSound("note.bass"),
    };
}
