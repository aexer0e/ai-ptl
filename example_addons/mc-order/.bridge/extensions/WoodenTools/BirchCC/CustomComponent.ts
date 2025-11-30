import ErrorHandler from "../Mangrove/Errors/ErrorHandler";
import { Context } from "../Mangrove/Types/CustomComponent";
import { ComponentProcessingError } from "./ErrorTypes";
import Template from "./Template";

export default class CustomComponent extends Function {
    private _name: string;
    private _template: typeof Template;

    constructor(name: string, template: typeof Template) {
        super("...args", "return this.define(...args)");
        this._name = name;
        this._template = template;
        return this.bind(this);
    }

    /** Defines the component */
    private define(a: any) {
        a.name(this._name);
        a.template((args: any, context: Context) => {
            const template = new this._template(this._name, args, context);

            // Run the process function and log any errors
            ErrorHandler.extendAndLogConsoleErrors(
                template.process.bind(template),
                ComponentProcessingError.with(template.Address),
                "BirchCC"
            );
        });
    }
}
