import AiPlayers from "AiPlayers/AiPlayers";
import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import WorldStore from "Store/World/WorldStore";
import { AiPlayerGoal } from "Types/AiPlayerGoal";
import ConfigurableData, { ConfigurableDataType } from "Types/ConfigurableData";

const ServerMenuData = [
    {
        type: "toggle",
        label: "Enable AI Player Griefing",
        getDefaultValue: () => WorldStore.get("AiPlayerGriefing"),
        handler: (data: boolean) => {
            WorldStore.set("AiPlayerGriefing", data);
        },
    } as ConfigurableData["Toggle"],
    {
        type: "dropdown",
        options: ["Neutral", "Friends", "Foes"],
        label: "Are AI Players friends or foes?",
        getDefaultValue: () => ["neutral", "friends", "foes"].indexOf(WorldStore.get("AiPlayerFriendliness")),
        handler: (data: number) => {
            const goal = ["neutral", "friends", "foes"][data] as AiPlayerGoal;
            WorldStore.set("AiPlayerFriendliness", goal);
            AiPlayer.Goal = goal;
        },
    } as ConfigurableData["Dropdown"],
    {
        type: "dropdown",
        options: ["Often", "Sometimes", "Never"],
        label: "How much should AI Players talk in chat?",
        getDefaultValue: () => ["often", "sometimes", "never"].indexOf(WorldStore.get("AiPlayerChatting")),
        handler: (data: number) => {
            const goal = ["neutral", "friends", "foes"][data];
            WorldStore.set("AiPlayerChatting", goal);
        },
    } as ConfigurableData["Dropdown"],
    {
        type: "slider",
        label: "How many AI Players would you like to invite?",
        minimumValue: 1,
        maximumValue: 10,
        valueStep: 1,
        getDefaultValue: () => WorldStore.get("AiPlayerMaxCount"),
        handler: (data: number) => {
            AiPlayers.setAiPlayerMaxCount(data);
        },
    } as ConfigurableData["Slider"],
] as ConfigurableDataType[];

export default ServerMenuData;
