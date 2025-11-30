import { AiPlayerGoal } from "../../Types/AiPlayerGoal";

export default {
    CbCopyVolumeModeSelected: 0 as number,
    CbCopyBlockModeSelected: 0 as number,
    CbLeftClickCopiesBlock: true as boolean,
    CbRightClickCopiesBlock: false as boolean,
    DrawVolumeTriggers: false as boolean,
    AiPlayerGoal: "stroll" as AiPlayerGoal,
    AiPlayerDebugNames: false as boolean,
    SerializedAiPlayers: [] as string[],
    AiPlayerGriefing: false as boolean,
    AiPlayerFriendliness: "neutral" as AiPlayerGoal,
    AiPlayerChatting: "sometimes" as string,

    AiPlayerMaxCount: 1 as number,
    RegisteredBedIdList: [] as string[],
} as const;
