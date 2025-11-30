import { ItemContext } from "../Mangrove/Types/CustomComponent";
import Template from "./Template";

export default class ItemTemplate extends Template {
    public declare context: ItemContext;

    /** Returns the source  of the item */
    protected get Source() {
        return this.context.sourceItem();
    }
}
