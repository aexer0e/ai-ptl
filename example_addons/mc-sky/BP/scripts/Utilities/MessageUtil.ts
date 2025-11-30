import { RawMessage } from "@minecraft/server";

export default class MessageUtil {
    static translate(key: string) {
        return { translate: key } as RawMessage;
    }
}
