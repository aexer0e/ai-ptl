import V3 from "Wrappers/V3";

export default class ReplacedBlock {
    typeId: string;
    location: V3;
    dimension: string;

    constructor(typeId: string, location: V3, dimension: string) {
        this.typeId = typeId;
        this.location = location;
        this.dimension = dimension;
    }
}
