class CustomComponent extends Function {
    constructor(name, template, schema = {}) {
        super("...args", "return this.define(...args)");
        this._name = name;
        this._schema = schema;
        this._template = template;
        return this.bind(this);
    }

    define(a) {
        a.name(this._name);
        a.schema(this._schema);
        a.template((args, opts) => {
            try {
                new this._template(this._name, args, opts).run();
            } catch (e) {
                this.throwError(opts, e);
            }
        });
    }

    getComponentType(location) {
        if (location.startsWith("minecraft:block")) return "block";
        if (location.startsWith("minecraft:item")) return "item";
        if (location.startsWith("minecraft:entity")) return "entity";
        return "unknown";
    }

    throwError(opts, error) {
        const identifier = opts.identifier;
        const componentType = this.getComponentType(opts.location);
        const componentName = this._name;

        console.log(`\nThe following error occurred while compiling '${componentName}' on ${componentType}/${identifier}:`);
        console.error(error);
    }
}
CustomComponent;
