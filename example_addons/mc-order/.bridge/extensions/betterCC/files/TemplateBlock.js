class TemplateBlock extends bCC.Template {
    getSource = () => this._opts.sourceBlock();

    getIdentifier() {
        try {
            return this.getSource()["minecraft:block"]["description"]["identifier"];
        } catch {
            return null;
        }
    }

    _setMenuCategory(category, group = false, override = true) {
        const data = { category, group };
        const location = "minecraft:block/description/menu_category";

        if (override) this._create(data, location, (_, oldData, newData) => Object.assign(oldData, newData));
        else this._create(data, location, (deepMerge, oldData, newData) => deepMerge(newData, oldData));
    }
    setMenuCategory(category, group = false, override = true) {
        this._setMenuCategory(category, group, override);
    }

    _addState(name, values) {
        this._create({ [name]: values }, "minecraft:block/description/states");
    }
    addState(name, values) {
        this._addState(name, values);
    }

    _addTrait(name, states) {
        this._create({ [name]: { enabled_states: states } }, "minecraft:block/description/traits");
    }
    addTrait(name, states) {
        this._addTrait(name, states);
    }

    _addPermutation(condition, components) {
        const merge = (_, oldData, newData) => (Array.isArray(oldData) ? oldData.concat(newData) : newData);

        this._create([{ condition, components }], "minecraft:block/permutations", merge);
    }
    addPermutation(condition, components) {
        condition = this._parseCondition(condition);
        this._addPermutation(condition, components);
    }

    _parseCondition(condition) {
        if (typeof condition !== "string") return condition;
        return condition.replace(/\$([:_a-zA-Z0-9]*)/g, "query.block_state('$1')");
    }
    parseCondition(condition) {
        return this._parseCondition(condition);
    }
    parseConditionMap(map) {
        return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, this.parseCondition(value)]));
    }

    _mapToCondition(map) {
        return Object.entries(map)
            .map(([key, value]) => `$${key} == ${value}`)
            .join(" && ");
    }
    mapToCondition(map) {
        return this._mapToCondition(map);
    }

    // Component creation
    _addComponents(components, override = true) {
        let location = "minecraft:block/components";

        if (override) this._create(components, location, (_, oldData, newData) => Object.assign(oldData, newData));
        else this._create(components, location, (deepMerge, oldData, newData) => deepMerge(newData, oldData));
    }
    addComponents(components, override = true) {
        this._addComponents(components, override);
    }

    addTag(tag) {
        this._addComponents({ [`tag:${tag}`]: {} }, false);
    }
    _addTag(tag) {
        this.addTag(tag);
    }
}
TemplateBlock;
