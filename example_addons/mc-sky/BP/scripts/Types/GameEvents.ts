import { Entity, ItemStack, Player } from "@minecraft/server";
import { ImpulseData } from "./ImpulseData";
import { Maybe } from "./Maybe";
import { Notification } from "./Notification";
import { NotificationType } from "./NotificationType";

export type AiPlayerAction = "mineBlock" | "attack";

export type GameEvents = {
    PlayerFullyJoined: [player: Player];
    PlayerSneakingChanged: [player: Player, isSneaking: boolean];
    PlayerEmoted: [player: Player, personaId: string];
    PlayerSelectedItemChanged: [player: Player, item: ItemStack | undefined, slotIndex: number];
    InventoryRulePassed: [player: Player, questId: string];
    queueNotification: [notificationType: NotificationType, notification: Maybe<Notification>, player: Player];
    notificationBroadcast: [notificationType: NotificationType, notification: Maybe<Notification>, player: Player];
    MovementImpulse: [player: Player, impulseData: ImpulseData];
    aiPlayerMessage: [entity: Entity, name: string, goalId: string, percentToSend: number, data?: Array<string>];
    aiPlayerAction: [entity: Entity, action: AiPlayerAction];
};
