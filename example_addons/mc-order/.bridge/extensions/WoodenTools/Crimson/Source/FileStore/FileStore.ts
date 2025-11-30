import CrimsonMethodStore from "./CrimsonMethodStore";
import CrimsonObjectStore from "./CrimsonObjectStore";
import CrimsonTemplateStore from "./CrimsonTemplateStore";

export default class FileStore {
    public static Template: CrimsonTemplateStore;
    public static Method: CrimsonMethodStore;
    public static Object: CrimsonObjectStore;

    public static getByPath(path: string) {
        return FileStore.Object.getItemByPath(path) || FileStore.Method.getItemByPath(path) || FileStore.Template.getItemByPath(path);
    }
}
