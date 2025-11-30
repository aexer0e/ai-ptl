import { Message } from "./Message";
export type Notification = { message: Message; duration: number; priority?: number; id?: string; skipCleanup?: boolean };
