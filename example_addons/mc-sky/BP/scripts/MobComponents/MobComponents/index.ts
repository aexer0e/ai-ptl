import AiBed from "./AiBed";
import AiPlayer from "./AiPlayer";
import AiPlayerPersona from "./AiPlayerPersona";
import FollowMarker from "./FollowMarker";
import MobComponent from "./MobComponent";
import PlayerInteractions from "./PlayerInteractions";
import PlayerJoin from "./PlayerJoin";

export default [
    PlayerJoin, //
    PlayerInteractions,
    AiPlayerPersona,
    AiPlayer,
    AiBed,
    FollowMarker,
] as (typeof MobComponent)[];
