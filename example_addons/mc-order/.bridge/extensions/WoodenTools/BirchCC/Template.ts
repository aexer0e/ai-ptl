import { Context, Operation } from "../Mangrove/Types/CustomComponent";
import { JSONObject, JSONValue } from "../Mangrove/Types/JSON";
import { ValidationError } from "./ErrorTypes";

export default class Template {
    protected name: string;
    protected args: JSONObject;
    protected context: Context;

    protected _isTest: boolean;
    protected _self: any;

    /** Returns address */
    public get Address() {
        return `${this.Type}/${this.Identifier}/${this.Name}`;
    }

    /** Returns the identifier */
    protected get Identifier() {
        return this.context.identifier;
    }

    /** Returns the source */
    protected get Source(): JSONObject {
        throw new Error("Source not implemented");
    }

    /** Returns the file type */
    protected get Type() {
        const location = this.context.location;
        if (location.startsWith("minecraft:block")) return "block";
        if (location.startsWith("minecraft:item")) return "item";
        if (location.startsWith("minecraft:entity")) return "entity";
        else return "unknown";
    }

    /** Returns the name */
    protected get Name() {
        return this.name;
    }

    /** Returns the arguments */
    protected get Arguments() {
        return this.args;
    }

    /** Returns the contexts */
    protected get Context() {
        return this.context;
    }

    /** Returns the environment */
    protected get IsDevelopment() {
        return this.context.mode == "development";
    }

    constructor(name: string, args: JSONObject, context: Context) {
        this.name = name;
        this.args = args;
        this.context = context;

        this._self = self;
        this._isTest = name == "gm1:test";
    }

    /** Process the template */
    public process() {
        // Add passed arguments to defaults
        const withPassed = this.mergeArgs(this._getDefaults(), this.args);
        // Add override arguments to passed
        const withOverrides = this.mergeArgs(withPassed, this._getOverrides());
        // Set arguments
        this.args = withOverrides as JSONObject;

        // If test, print arguments
        if (this._isTest) console.log(this.args);

        // If not valid, return
        if (!this._validate()) return;

        this._buildStart();
        this._build();
        this._buildEnd();
    }

    /** Merges two JSON objects */
    private mergeArgs(target: JSONValue, source: JSONValue) {
        if (typeof target !== "object" || typeof source !== "object") return source;

        source = source as JSONObject;
        target = target as JSONObject;

        Object.keys(source).forEach((key) => {
            const targetValue = target[key];
            const sourceValue = source[key];

            target[key] = this.mergeArgs(targetValue, sourceValue);
        });

        return target;
    }

    /** Combines all child versions of a method into a array */
    private _combineOverrideMethodsToArray<T = Function>(name: string): T[] {
        const output: T[] = [];

        let obj = this;
        let previous = null;
        while (obj) {
            let method = obj[name];
            if (method !== undefined && method !== previous) output.push(method);
            previous = method;
            obj = Object.getPrototypeOf(obj);
        }

        return output.reverse();
    }

    /** Method to be called to get the default arguments */
    public get Defaults() {
        return {};
    }
    private _getDefaults() {
        let args = {};
        for (const f of this._combineOverrideMethodsToArray<JSONObject>("Defaults")) {
            args = this.mergeArgs(args, f) as JSONObject;
        }
        return args;
    }

    /** Method to be called to get the argument overrides */
    public get Overrides() {
        return {};
    }
    private _getOverrides() {
        let args = {};
        for (const f of this._combineOverrideMethodsToArray<JSONObject>("Overrides")) {
            args = this.mergeArgs(args, f) as JSONObject;
        }
        return args;
    }

    /** Method to be called to validate the arguments */
    public validate(): void {
        return;
    }
    private _validate() {
        return this._combineOverrideMethodsToArray("validate").every((f) => f.call(this) ?? true);
    }

    /** Method to be called at the start of the build process */
    public buildStart(): void {}
    private _buildStart() {
        for (const f of this._combineOverrideMethodsToArray("buildStart")) f.call(this);
    }

    /** Method to be called during the build process */
    public build(): void {}
    private _build() {
        for (const f of this._combineOverrideMethodsToArray("build")) f.call(this);
    }

    /** Method to be called at the end of the build process */
    public buildEnd(): void {}
    private _buildEnd() {
        for (const f of this._combineOverrideMethodsToArray("buildEnd")) f.call(this);
    }

    /* Check if the argument exists, using '/' to denote nesting */
    protected hasArgument(arg: string) {
        const path = arg.split("/");
        let obj: JSONValue = this.args;
        for (const p of path) {
            obj = obj![p];
            if (obj === undefined) return false;
        }
        return true;
    }

    /** Asserts that the argument exists */
    protected assertArgument(arg: string) {
        if (this.hasArgument(arg)) return;

        throw new ValidationError(`The component '${this.name}' requires the argument '${arg}'`);
    }

    /** Asserts that the argument is of a certain type */
    protected assertType(arg: string, type: string) {
        if (typeof arg === type) return;

        throw new ValidationError(`The component '${this.name}' requires the argument '${arg}' to be type ${type}`);
    }

    /** Asserts that the argument is of a certain length */
    protected assertLength(arg: string, length: number) {
        const value = this.Arguments[arg];
        if (!Array.isArray(value)) return;
        if (value.length == length) return;

        throw new ValidationError(`The component '${this.name}' requires the argument '${arg}' to be length ${length}`);
    }

    /** Add data to object */
    protected create(data: JSONValue, location?: string, operation?: Operation) {
        return this.context.create(data, location ?? "", operation);
    }

    /** Function definition of deep merge operation */
    protected mergeOperation(deepMerge: Function, oldData: JSONObject, newData: JSONObject) {
        return deepMerge(newData, oldData);
    }

    /** Function definition of override operation */
    protected overrideOperation(_: Function, oldData: JSONObject, newData: JSONObject) {
        return Object.assign(oldData, newData);
    }
}
