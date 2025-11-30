class TemplateEntity extends bCC.Template {
    variablesToInit = {};
    animationControllerQueue = [];

    buildEnd() {
        // Handles init variables
        if (Object.keys(this.variablesToInit).length > 0) {
            let on_entry = Object.entries(this.variablesToInit).map(([k, v]) => `${k} = ${v};`);
            let ac = this._createAnimationController({ states: { default: { on_entry: on_entry } } }, false);
            this._create(ac, "minecraft:entity/description/scripts/animate", (_, oldData, newData) => {
                if (Array.isArray(oldData)) return [newData].concat(oldData);
                else return [newData];
            });
        }

        if (this.animationControllerQueue.length > 0) {
            // Create animation controllers in order
            this.animationControllerQueue.sort(function (a, b) {
                return a[2] - b[2];
            });
            for (let ac of this.animationControllerQueue) {
                this._createAnimationController(ac[0], ac[1]);
            }
        }
    }

    isInGroup = () => this._opts.location != "minecraft:entity/components";
    getGroupName = () => (this.isInGroup() ? this._opts.location.split("/")[2] : null);

    // Component must be in a component group
    #throwNotInGroup() {
        throw Error(`The component '${this._name}' must be placed in a component group`);
    }
    requireGroup() {
        if (!this.isInGroup()) this.#throwNotInGroup();
    }

    // Component must be in 'components'
    #throwInGroup() {
        throw Error(`The component '${this._name}' cannot be placed in a component group`);
    }
    requireStatic() {
        if (this.isInGroup()) this.#throwInGroup();
    }

    // Creation components
    _addComponents(components, isLocal = true, override = true) {
        let location = isLocal ? this._opts.location : "minecraft:entity/components";

        if (override) this._create(components, location);
        else this._create(components, location, (deepMerge, oldData, newData) => deepMerge(newData, oldData));
    }
    addComponents(components, isLocal = true, override = true) {
        this._addComponents(components, isLocal, override);
    }

    linkAnimation(animation, key = false, name = false) {
        if (!name) name = animation;

        this._create({ [name]: animation }, "minecraft:entity/description/animations");

        if (key) {
            this._create({ [name]: key }, "minecraft:entity/description/scripts/animate");
        }
    }

    _createAnimationController(data, key = null) {
        return this._opts.animationController(data, key);
    }
    createAnimationController(data, key = null) {
        return this._createAnimationController(data, key);
    }

    _createAnimation(data, key = null) {
        return this._opts.animation(data, key);
    }
    createAnimation(data, key = null) {
        return this._createAnimation(data, key);
    }

    _createComponentGroup(group_name, components) {
        this._create({ [group_name]: components }, "minecraft:entity/component_groups");
    }
    createComponentGroup(group_name, components) {
        this._createComponentGroup(group_name, components);
    }

    _createEvent(name, data) {
        this._create({ [name]: data }, "minecraft:entity/events");
    }
    createEvent(name, data) {
        this._createEvent(name, data);
    }

    _createDialogueScene(scene, open = false) {
        this._opts.dialogueScene(scene, open);
    }
    createDialogueScene(scene, open = false) {
        this._createDialogueScene(scene, open);
    }

    _createState(name, data) {
        this._create({ [name]: data }, "minecraft:entity/description/properties");
    }
    createState(name, data) {
        this._createState(name, data);
    }

    getSource = () => this._opts.sourceEntity();
    initVariables(vs, n = 0) {
        for (let v of vs) this.variablesToInit[v] = n;
    }

    _runCommands(commands) {
        this.createAnimationController({ states: { default: { on_entry: commands } } });
    }
    runCommands(commands) {
        this._runCommands(commands);
    }

    _runCommandsAfterTicks(commands, tick) {
        let seconds = parseFloat((tick * 0.05).toFixed(2));
        this.createAnimation({
            timeline: { [seconds]: commands },
            loop: false,
            animation_length: seconds + 0.05,
        });
    }

    runCommandsAfterTicks(commands, tick) {
        this._runCommandsAfterTicks(commands, tick);
    }

    loopCommandsOnTick(commands, ticks = 0) {
        let len = 0.01;
        if (ticks > 0) len = ticks * 0.05;

        this.createAnimation({
            timeline: { "0.0": commands },
            animation_length: len,
            loop: true,
        });
    }

    loopCommands(commands, min_time, max_time = false, warmup_time = 0) {
        if (!max_time) max_time = min_time;

        let id = Math.floor(Math.random() * 999999);

        this.initVariables([`v.runtime_${id}`]);

        let random_time = `Math.random(${min_time}, ${max_time})`;
        if (min_time < 0 && max_time < 0) random_time = "99999999";

        this.createAnimationController({
            states: {
                default: {
                    on_entry: [`v.runtime_${id} = q.life_time;`],
                    transitions: [{ run: `q.life_time > v.runtime_${id} + ${warmup_time}` }],
                },
                run: {
                    on_entry: commands,
                    transitions: [{ cooldown: "1" }],
                },
                cooldown: {
                    on_entry: [`v.runtime_${id} = q.life_time;`, `v.time_${id} = ${random_time};`],
                    transitions: [
                        {
                            default: `q.life_time > v.runtime_${id} + v.time_${id}`,
                        },
                    ],
                },
            },
        });
    }

    setRuntimeIdentifier(id) {
        this._create({ description: { runtime_identifier: id } }, "minecraft:entity");
    }

    // Get Identifier
    getIdentifier() {
        try {
            return this.getSource()["minecraft:entity"]["description"]["identifier"];
        } catch {
            return null;
        }
    }

    queueAnimationController(data, index = 0, query = null) {
        this.animationControllerQueue.push([data, query, index]);
    }
}
TemplateEntity;
