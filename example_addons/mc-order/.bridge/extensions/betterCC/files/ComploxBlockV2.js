class ComploxBlockV2 extends bCC.TemplateBlock {
    getDefaults() {
        return {
            default: {
                geometry: "geometry.cx.base.material_cube",
                material: { render_method: "opaque" },
                collision: { origin: [-8, 0, -8], size: [16, 16, 16] },
            },
            variants: {
                _inventory: {},
            },
        };
    }

    requireVariantArgument(arg) {
        // If argument is in defaults, we don't need it in every variant
        const defaults = this.getArgument("default");
        if (defaults[arg]) return;

        const variants = this.getArgument("variants");
        for (const variant of Object.values(variants)) if (!variant[arg]) this.throwMissingVariantArgument(arg);
    }

    throwMissingVariantArgument(arg) {
        throw Error(`The component '${this._name}' requires the argument '${arg}' in every variant or as a default value`);
    }

    validate() {
        this.requireVariantArgument("texture");
    }

    build() {
        if (this.isDevelopment()) this.addState("cx:_dev", ["inventory", "update", "static"]);
        this.buildStates();

        this.buildPermutations();

        this.addTag("cx");

        let defaults = this.getArgument("default");
        // CCs can specify a variant to use as the base for a block, to overcome bugs like MCM-1679, but can cause issues with default values
        if (defaults._base) defaults = { ...defaults, ...this.getVariant(defaults._base) };

        this.addComponents(this.getVariantComponents(defaults));
        this.buildComponents();
    }

    buildEnd() {
        this.addVariant(`$cx:_dev == 'inventory'`, "_inventory");
    }

    buildStates() {}
    buildPermutations() {}
    buildComponents() {}

    // State helpers
    addPredefinedState(name) {
        switch (name) {
            case "cx:cardinal":
                this.addState(name, ["north", "east", "south", "west"]);
                break;
            case "cx:direction":
                this.addState(name, ["north", "east", "south", "west", "up", "down"]);
                break;
            case "cx:axis":
                this.addState(name, ["x", "y", "z"]);
                break;
            case "cx:connection":
                this.addState(name, ["zero", "one", "corner", "parallel", "three", "four"]);
                break;
        }
    }

    addBooleanState(name, defaultValue = false) {
        this.addState(name, [defaultValue, !defaultValue]);
    }

    // Component helpers
    getTransformComponent(rotation = [0, 0, 0], offset = [0, 0, 0]) {
        return {
            "minecraft:transformation": {
                rotation: rotation,
                translation: offset,
            },
        };
    }

    // Variant helpers
    addVariant(condition, name, overrides = {}) {
        const variant = this.getVariant(name);
        const variantComponents = this.getVariantComponents(variant);

        const components = { ...variantComponents, ...overrides };
        this.addPermutation(condition, components);
    }

    getVariant(name) {
        const variant = this.getArgument("variants")[name];
        if (!variant) return {};
        return this.processVariant(variant);
    }

    processVariant(variant) {
        const defaults = this.getArgument("default");

        if (variant.material) variant.material = { ...defaults.material, ...variant.material };
        if (variant.texture && !variant.material) variant.material = defaults.material;
        if (variant.material && !variant.texture) variant.texture = defaults.texture;

        if (variant.bones && !variant.geometry) variant.geometry = defaults.geometry;

        return variant;
    }

    getVariantComponents(variant) {
        const geometry = variant.geometry;
        const collision = variant.collision;
        // If no selection is provided, use the collision box
        const selection = variant.selection || collision;
        const texture = variant.texture;
        const material = variant.material;
        const bones = variant.bones;
        const rotation = variant.rotation;

        const components = {};

        if (geometry) {
            components["minecraft:geometry"] = { identifier: geometry };

            if (bones) {
                const boneVisibility = this.parseConditionMap(bones);
                components["minecraft:geometry"]["bone_visibility"] = boneVisibility;
            }
        }
        if (collision) {
            const { origin, size } = collision;
            const cleanCollision = { origin, size };

            components["minecraft:collision_box"] = cleanCollision;
        }
        if (selection) {
            const { origin, size } = selection;
            const cleanSelection = { origin, size };

            components["minecraft:selection_box"] = cleanSelection;
        }
        if (texture && material) {
            components["minecraft:material_instances"] = { "*": { texture: texture, ...material } };
        }
        if (rotation) {
            components["minecraft:transformation"] = { rotation: rotation };
        }

        return components;
    }

    // Component helpers
    combineCollision(alpha, beta) {
        const alphaOrigin = alpha.origin;
        const alphaSize = alpha.size;

        const betaOrigin = beta.origin;
        const betaSize = beta.size;

        const origin = [
            Math.min(alphaOrigin[0], betaOrigin[0]),
            Math.min(alphaOrigin[1], betaOrigin[1]),
            Math.min(alphaOrigin[2], betaOrigin[2]),
        ];

        const size = [
            Math.max(alphaOrigin[0] + alphaSize[0], betaOrigin[0] + betaSize[0]) - origin[0],
            Math.max(alphaOrigin[1] + alphaSize[1], betaOrigin[1] + betaSize[1]) - origin[1],
            Math.max(alphaOrigin[2] + alphaSize[2], betaOrigin[2] + betaSize[2]) - origin[2],
        ];

        return { origin, size };
    }

    addTagData(key, value) {
        this.addTag(`cx.data.${key}:${value}`);
    }
}
ComploxBlockV2;
