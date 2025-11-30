import { BlockComponentRegistry, BlockCustomComponent } from "@minecraft/server";

/**
 * AbstractBlockComponent is a base class for custom block components.
 * It provides static methods for registering and initializing components.
 *
 */
export default class AbstractBlockComponent {
    /**
     * Registers the custom block component with the provided registry.
     *
     * @param registry - The registry to register the custom component with, passed in from the WorldInitializeBeforeEvent
     */
    public static register(registry: BlockComponentRegistry) {
        registry.registerCustomComponent(this.identifier, this.events);
    }

    /**
     * Defines the custom events for the block component to register
     *
     * @returns {BlockCustomComponent} An object representing the custom events.
     * @example
     * // Example of defining custom events
     * public static get events(): BlockCustomComponent {
     *     return {
     *         onStepOn: this.onStepOn.bind(this),
     *     };
     * }
     *
     * private static onStepOn(event: BlockComponentStepOnEvent) {
     *     // Define the onStepOn event callback logic here
     * }
     */
    public static get events(): BlockCustomComponent {
        return {};
    }

    /**
     * Gets the identifier for the abstract block component.
     *
     * @returns {string} The identifier string, default to "gm1_ord:abstract".
     */
    public static get identifier() {
        return "gm1_ord:abstract";
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static init(registry: BlockComponentRegistry) {
        throw new Error("Method not implemented.");
    }
}
