import AiPlayer from "MobComponents/MobComponents/AiPlayer";
import WorldStore from "Store/World/WorldStore";
import { AiPlayerGoal } from "Types/AiPlayerGoal";
import ConfigurableData, { ConfigurableDataType } from "Types/ConfigurableData";

const ConfigurablesData = [
    {
        type: "toggle",
        label: "Draw Volume Triggers",
        getDefaultValue: () => WorldStore.get("DrawVolumeTriggers"),
        handler: (data: boolean) => {
            WorldStore.set("DrawVolumeTriggers", data);
        },
    } as ConfigurableData["Toggle"],
    {
        type: "toggle",
        label: "Ai Player Debug Names",
        getDefaultValue: () => WorldStore.get("AiPlayerDebugNames"),
        handler: (data: boolean) => {
            WorldStore.set("AiPlayerDebugNames", data);
        },
    } as ConfigurableData["Toggle"],
    {
        type: "dropdown",
        options: ["stroll", "go_to_ai_bed", "chop_tree"],
        label: "AI Player Goal",
        getDefaultValue: () => ["stroll", "go_to_ai_bed", "chop_tree"].indexOf(WorldStore.get("AiPlayerGoal")),
        handler: (data: number) => {
            const goal = ["stroll", "go_to_ai_bed", "chop_tree"][data] as AiPlayerGoal;
            WorldStore.set("AiPlayerGoal", goal);
            AiPlayer.Goal = goal;
        },
    } as ConfigurableData["Dropdown"],
] as ConfigurableDataType[];

export default ConfigurablesData;
