import V3 from "Wrappers/V3";

/**
 * Represents a 3D volume defined by minimum and maximum points.
 */
export interface Volume {
    min: V3;
    max: V3;
}
