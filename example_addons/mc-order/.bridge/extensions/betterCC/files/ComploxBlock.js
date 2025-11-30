class ComploxBlock extends bCC.TemplateBlock {
    getDefaults() {
        return {
            geometry: "geometry.cx.material_cube",
        };
    }

    validate() {
        this.requireArgument("geometry");
        this.requireArgument("texture");
    }

    build() {
        if (this.isDevelopment()) this.addState("cx:_dev", ["inventory", "update", "static"]);
        this.buildStates();

        const texture = this.getArgument("texture");
        const geometry = this.getArgument("geometry");

        this.buildPermutations();

        this.addTag("cx");
        this.addComponents(this.getVariantComponents(texture, geometry));
        this.buildComponents();
    }

    buildEnd() {
        this.addPermutation(`$cx:_dev == 'inventory'`, this.getInventoryComponents());
    }

    buildStates() {}
    buildPermutations() {}
    buildComponents() {}

    getSingleValue(value, key) {
        if (Array.isArray(value)) return value[key ?? 0];
        if (typeof value === "object") return value[key ?? Object.keys(value)[0]];
        return value;
    }

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

    // Permutation helpers
    getInventoryComponents() {
        return {};
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

    getVariantComponents(texture, geometry, index = null) {
        texture = this.getSingleValue(texture, index);
        geometry = this.getSingleValue(geometry, index);

        return {
            ...this.getGeometryComponent(geometry),
            "minecraft:material_instances": { "*": { texture: texture, render_method: "blend" } },
        };
    }

    getCollisionComponents(collision, index = null, onlyCollision = false) {
        // If the collision is just one origin size pair, make it an array
        if ("origin" in collision && "size" in collision) {
            collision = [collision];
            index = null;
        }

        const { origin, size } = this.getSingleValue(collision, index);

        const components = {
            "minecraft:collision_box": {
                origin,
                size,
            },
        };

        if (!onlyCollision) components["minecraft:selection_box"] = components["minecraft:collision_box"];

        return components;
    }

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

    getGeometryComponent(identifier, conditions = {}) {
        const component = {
            "minecraft:geometry": {
                identifier,
            },
        };

        const bone_visibility = {};
        for (const [bone, condition] of Object.entries(conditions)) bone_visibility[bone] = this._parseCondition(condition);
        if (bone_visibility) component["minecraft:geometry"]["bone_visibility"] = bone_visibility;

        return component;
    }
}
ComploxBlock;
