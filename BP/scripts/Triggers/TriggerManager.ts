import Triggers from "./Triggers/index";

export default class TriggerManager {
    private static triggers = new Map<keyof typeof Triggers, InstanceType<(typeof Triggers)[keyof typeof Triggers]>>();

    static init() {
        for (const TriggerKey in Triggers) {
            const Trigger = Triggers[TriggerKey] as (typeof Triggers)[keyof typeof Triggers];
            this.triggers.set(TriggerKey as keyof typeof Triggers, new Trigger());
        }
    }

    static getTrigger<T extends keyof typeof Triggers>(trigger: T) {
        return this.triggers.get(trigger) as InstanceType<(typeof Triggers)[T]>;
    }
}
