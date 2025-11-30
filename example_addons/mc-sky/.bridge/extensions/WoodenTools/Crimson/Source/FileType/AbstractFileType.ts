import FileDependencies from "../FileDependencies";

export default class AbstractFileType<T = object> {
    protected identifier: string;
    protected data: T;
    protected path: string;
    protected fileDependencies: FileDependencies = new FileDependencies();

    public get Identifier() {
        return this.identifier;
    }

    public get Data() {
        return this.data;
    }

    public get Path() {
        return this.path;
    }

    public get FileDependencies() {
        return this.fileDependencies;
    }

    constructor(data: T, path: string) {
        this.data = data;
        this.path = path;
    }
}
