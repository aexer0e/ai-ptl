import ChaosEmerald from "./ChaosEmerald";
import ChaosMachine from "./ChaosMachine";
import CharActivation from "./CharActivation";
import Drill from "./Drill";
import Eggman from "./Eggman";
import EggmanRider from "./EggmanRider";
import Eggrobo from "./Eggrobo";
import EggroboProjectile from "./EggroboProjectile";
import IntroBook from "./IntroBook";
import Missile from "./Missile";
import MissileMarker from "./MissileMarker";
import MobComponent from "./MobComponent";
import PlayerJoin from "./PlayerJoin";
import PlayerMovement from "./PlayerMovement";
import ShrineMarker from "./ShrineMarker";
export default [
    IntroBook, //
    PlayerJoin,
    PlayerMovement,
    CharActivation,
    Eggman,
    Eggrobo,
    Missile,
    EggmanRider,
    MissileMarker,
    ChaosMachine,
    ChaosEmerald,
    Drill,
    ShrineMarker,
    EggroboProjectile,
] as (typeof MobComponent)[];
