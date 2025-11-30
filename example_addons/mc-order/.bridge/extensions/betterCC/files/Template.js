class Template {
    constructor(name, args, opts) {
        this._name = name;
        this._args = args;
        this._opts = opts;

        this._isTest = name == "gm1:test";
    }

    isObject = (obj) => obj && typeof obj === "object";

    mergeArgs(target, source) {
        if (!this.isObject(target) || !this.isObject(source)) return source;

        Object.keys(source).forEach((key) => {
            const targetValue = target[key];
            const sourceValue = source[key];

            target[key] = this.mergeArgs(targetValue, sourceValue);
        });

        return target;
    }

    run() {
        if (!Array.isArray(this._args)) {
            const withPassed = this.mergeArgs(this.#getDefaults(), this._args);
            const withOverrides = this.mergeArgs(withPassed, this.#getOverrides());

            this._args = withOverrides;
        }

        if (this._isTest) console.log(this._args);

        if (this.#validate()) {
            this.#buildStart();
            this.#build();
            this.#buildEnd();
        }
    }

    get arguments() {
        return this._args;
    }
    get options() {
        return this._opts;
    }

    isDevelopment() {
        return self.bCC._isDevelopment;
    }

    _combineOverrideMethodsToList(name) {
        let ins = this;
        let prev = null;
        let output = [];

        while (ins) {
            let m = ins[name];
            if (m !== undefined && m !== prev) output.push(m);
            prev = m;
            ins = Object.getPrototypeOf(ins);
        }

        return output.reverse();
    }

    getDefaults() {
        return {};
    }
    #getDefaults() {
        let defaults = {};
        this._combineOverrideMethodsToList("getDefaults").forEach((f) => {
            defaults = this.mergeArgs(defaults, f.call(this));
        });

        return defaults;
    }

    getOverrides = () => ({});
    #getOverrides() {
        let overrides = {};
        this._combineOverrideMethodsToList("getOverrides").forEach((f) => {
            overrides = this.mergeArgs(overrides, f.call(this));
        });

        return overrides;
    }

    build() {}
    #build() {
        this._combineOverrideMethodsToList("build").forEach((f) => {
            f.call(this);
        });
    }

    validate() {}
    #validate() {
        let results = this._combineOverrideMethodsToList("validate").map((f) => {
            return f.call(this) ?? true;
        });
        return results.every((e) => e == true);
    }

    buildEnd() {}

    #buildEnd() {
        this._combineOverrideMethodsToList("buildEnd").forEach((f) => {
            f.call(this);
        });
    }

    #buildStart() {
        this._combineOverrideMethodsToList("buildStart").forEach((f) => {
            f.call(this);
        });
    }

    // Handling arguments
    hasArgument(arg) {
        const path = arg.split("/");
        let obj = this._args;
        for (const p of path) {
            obj = obj[p];
            if (obj === undefined) return false;
        }
        return true;
    }

    getArgument = (arg) => this._args[arg];
    setArgument = (arg, v) => (this._args[arg] = v);
    #throwMissingArgument(arg) {
        throw Error(`The component '${this._name}' requires the argument '${arg}'`);
    }
    requireArgument(arg) {
        if (!this.hasArgument(arg)) this.#throwMissingArgument(arg);
    }

    // Require specific data type
    #throwWrongType(arg, type) {
        throw Error(`The component '${this._name}' requires the argument '${arg}' to be type ${type}`);
    }
    requireType(arg, type) {
        if (typeof arg !== type) {
            this.#throwWrongType(arg, type);
        }
    }

    // Argument must be a certain length
    #throwWrongLength(arg, len) {
        throw Error(`The component '${this._name}' requires the argument '${arg}' to be length ${len}`);
    }
    requireLength(arg, len) {
        if (Array.isArray(this.getArgument(arg)) && this.getArgument(arg).length != len) {
            this.#throwWrongLength(arg, len);
        }
    }

    // Create data in file
    _create(template, location = "", operation = null) {
        this._opts.create(template, location, operation);
    }

    create(template, location = "", operation = null) {
        this._create(template, location, operation);
    }
}
Template;
