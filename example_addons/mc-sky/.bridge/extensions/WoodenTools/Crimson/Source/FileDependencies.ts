import FileStore from "./FileStore/FileStore";
import AbstractFileType from "./FileType/AbstractFileType";
import { ScopeAccess } from "./Types";

export default class FileDependencies {
    private paths: string[] = [];

    public get Paths() {
        return this.paths;
    }

    public addFile(file: AbstractFileType) {
        this.addPath(file.Path);
    }

    public addFilesFromScopeAccess(scope: ScopeAccess) {
        for (const o of scope.objects) {
            const file = FileStore.Object.Items[o];
            if (file) this.addFile(file);
        }
    }

    public addPath(path: string) {
        if (!this.paths.includes(path)) this.paths.push(path);
    }

    public clear() {
        this.paths = [];
    }
}
