import { Direction, Vector3 } from "@minecraft/server";

export default interface Face {
    location: Vector3;
    direction: Direction;
}
