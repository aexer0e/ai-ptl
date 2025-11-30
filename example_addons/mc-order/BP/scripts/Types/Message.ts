import { RawMessage } from "@minecraft/server";

/**
 * Represents a message which can be an array of `RawMessage` or strings,
 * a single `RawMessage`, or a single string.
 *
 * @typedef {Array<RawMessage | string> | RawMessage | string} Message
 */
export type Message = (RawMessage | string)[] | RawMessage | string;
