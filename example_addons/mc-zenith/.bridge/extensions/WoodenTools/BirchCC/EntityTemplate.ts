import { EntityContext } from "../Mangrove/Types/CustomComponent";
import { JSONObject } from "../Mangrove/Types/JSON";
import { ValidationError } from "./ErrorTypes";
import Template from "./Template";

type StringNumberBoolean = string | number | boolean;

export default class EntityTemplate extends Template {
    protected declare context: EntityContext;
    private variablesToInit: { [key: string]: StringNumberBoolean } = {};

    /** Returns the source of the entity */
    protected get Source() {
        return this.context.sourceEntity();
    }

    /** Define variables to initialize on the entity */
    protected initVariables(variables: string[], value: StringNumberBoolean = 0) {
        for (let v of variables) this.variablesToInit[v] = value;
    }

    public buildEnd() {
        if (Object.keys(this.variablesToInit).length === 0) return;

        // Create an animation controller to initialize the variables
        let onEntry = Object.entries(this.variablesToInit).map(([k, v]) => `${k} = ${v};`);
        let controller = this.createAnimationController({ states: { default: { on_entry: onEntry } } });
        this.linkAnimation(controller, "init");
    }

    /** Check if the component is in a group */
    private isInGroup = () => this.context.location != "minecraft:entity/components";

    /** Returns the the name group of the component */
    get Group() {
        return this.isInGroup() ? this.context.location.split("/")[2] : null;
    }

    /** Asserts that the component is in a group */
    protected assertGroup() {
        if (this.isInGroup()) return;

        throw new ValidationError(`The component '${this.name}' must be placed in a component group`);
    }

    /** Asserts that the component is not in a group */
    protected assertStatic() {
        if (!this.isInGroup()) return;

        throw new ValidationError(`The component '${this.name}' cannot be placed in a component group`);
    }

    /** Set the runtime identifier of the entity */
    protected setRuntimeIdentifier(id: string) {
        this.create({ description: { runtime_identifier: id } }, "minecraft:entity");
    }

    /** Link an animation to the entity */
    protected linkAnimation(animation: string, name?: string, query: string = "1.0") {
        if (!name) name = animation;

        this.create({ [name]: animation }, "minecraft:entity/description/animations");
        this.create({ [name]: query }, "minecraft:entity/description/scripts/animate");
    }

    /** Create an animation controller */
    protected createAnimationController(data: JSONObject, query?: string) {
        return this.context.animationController(data, query);
    }

    /** Create an animation */
    protected createAnimation(data: JSONObject, query?: string) {
        return this.context.animation(data, query);
    }

    /** Create a dialogue scene */
    protected createDialogueScene(scene: JSONObject, open = false) {
        this.context.dialogueScene(scene, open);
    }

    /** Create a state on the entity */
    protected addState(name: string, values: string[]) {
        this.create({ [name]: values }, "minecraft:entity/description/properties");
    }

    /** Add components to the entity */
    protected addComponents(components: JSONObject, isLocal = true, override = true) {
        let location = isLocal ? this.context.location : "minecraft:entity/components";
        this.create(components, location, override ? undefined : this.mergeOperation);
    }

    /** Create a component group on the entity */
    protected addComponentGroup(name: string, components: JSONObject) {
        this.create({ [name]: components }, "minecraft:entity/component_groups");
    }

    /** Create an event on the entity */
    protected addEvent(name: string, event: JSONObject) {
        this.create({ [name]: event }, "minecraft:entity/events");
    }

    /** Run commands on the entity */
    protected runCommands(commands: string[], tickDelay: number = 0) {
        // If no delay, create an animation controller
        if (tickDelay <= 0) {
            this.createAnimationController({ states: { default: { on_entry: commands } } });
        }
        // If delay, create an animation
        else {
            let seconds = parseFloat((tickDelay * 0.05).toFixed(2));
            this.createAnimation({
                timeline: { [seconds]: commands },
                loop: false,
                animation_length: seconds + 0.05,
            });
        }
    }

    /** Loop commands on the entity */
    protected loopCommands(commands: string[], tickDelay = 0) {
        let length = 0.01;
        if (tickDelay > 0) length = tickDelay * 0.05;

        this.createAnimation({
            timeline: { "0.0": commands },
            animation_length: length,
            loop: true,
        });
    }
}
