export default class JsonUtils {
    public static stripCommentsFromText(text: string) {
        return text.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? "" : m));
    }

    public static duplicateObject<T extends object>(data: T): T {
        // If not an object, return data
        if (typeof data !== "object" || data === null) return data;

        // If array, duplicate each element
        const result: any = Array.isArray(data) ? [] : {};
        for (const key in data) result[key] = this.duplicateObject(data[key] as T);
        return result;
    }

    public static mergeJSON(target: any, source: any) {
        // If both are arrays, concat them
        if (Array.isArray(target) && Array.isArray(source)) return target.concat(source);
        // If either isn't an object, override with source
        else if (!this.isObject(source) || !this.isObject(target)) return source;

        // Duplicate target
        target = this.duplicateObject(target);
        // Merge source into target
        for (const key in source) target[key] = this.mergeJSON(target[key], source[key]);
        return target;
    }

    public static mergeJSONArray(target: object, source: object[]) {
        let sources = {};
        for (const s of source) sources = this.mergeJSON(sources, s);
        return this.mergeJSON(sources, target);
    }

    public static isObject = (o: any) => typeof o === "object" && !Array.isArray(o) && o !== null;

    public static isJSONEqual(target: object, source: object) {
        // If an array, compare each element
        if (Array.isArray(target) && Array.isArray(source)) {
            if (target.length !== source.length) return false;
            for (let i = 0; i < target.length; i++) if (!this.isJSONEqual(target[i], source[i])) return false;
            return true;
        }
        // If not an object, compare directly
        if (!this.isObject(source) || !this.isObject(target)) return target === source;

        // If is an object, compare each key
        const keys = new Set([...Object.keys(target), ...Object.keys(source)]);
        for (const key of keys) if (!this.isJSONEqual(target[key], source[key])) return false;
        return true;
    }
}
