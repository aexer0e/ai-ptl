import { RawMessage } from "@minecraft/server";

export type Message = (RawMessage | string)[] | RawMessage | string;
