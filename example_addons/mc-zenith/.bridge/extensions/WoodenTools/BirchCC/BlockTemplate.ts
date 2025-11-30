import { BlockContext, Operation } from "../Mangrove/Types/CustomComponent";
import { JSONLiteral, JSONObject, JSONValue } from "../Mangrove/Types/JSON";
import Template from "./Template";

export default class BlockTemplate extends Template {
    public declare context: BlockContext;

    /** Returns the source of the block */
    protected get Source() {
        return this.context.sourceBlock();
    }

    /** Set menu category */
    protected setMenuCategory(category: string, group: string | boolean = false, override: boolean = true) {
        const data = { category, group };
        const operation = override ? this.overrideOperation : this.mergeOperation;
        this.create(data, "minecraft:block/description/menu_category", operation);
    }

    /** Add block state */
    protected addState(name: string, values: JSONLiteral[]) {
        this.create({ [name]: values }, "minecraft:block/description/states");
    }

    /** Add block trait */
    protected addTrait(name: string, states: JSONLiteral[]) {
        this.create({ [name]: { enabled_states: states } }, "minecraft:block/description/traits");
    }

    /** Add block component */
    protected addPermutation(condition: JSONValue, components: JSONObject) {
        const merge: Operation = (_: Function, oldData: JSONObject, newData: JSONObject) => {
            return Array.isArray(oldData) ? oldData.concat(newData) : newData;
        };

        condition = this.parseCondition(condition);
        this.create([{ condition, components }], "minecraft:block/permutations", merge);
    }

    /** Parse conditions in dollar format */
    protected parseCondition(condition: JSONValue) {
        if (typeof condition !== "string") return condition;
        return condition.replace(/\$([:_a-zA-Z0-9]*)/g, "query.block_state('$1')");
    }

    /** Parse map of conditions */
    protected parseConditionMap(map: JSONObject) {
        return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, this.parseCondition(v)]));
    }

    /** Convert map to equality conditions */
    protected mapToCondition(map: JSONObject) {
        return Object.entries(map)
            .map(([k, v]) => `$${k} == ${v}`)
            .join(" && ");
    }

    /** Add block components */
    protected addComponents(components: JSONObject, override = true) {
        const operation = override ? this.overrideOperation : this.mergeOperation;
        return this.create(components, "minecraft:block/components", operation);
    }

    /** Add block tag */
    protected addTag(tag: string) {
        return this.addComponents({ [`tag:${tag}`]: {} }, false);
    }
}
