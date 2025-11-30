import { CallFunction, CallObject, JSONObject, Scope } from "../../../.bridge/extensions/WoodenTools/Crimson/Source/Types";
import OaklogueFile from "./OaklogueFile";

const script: CallFunction = (scope: Scope) => {
    const locals = scope.locals;
    const dialogue = locals["$object"];

    // Handle dialog
    const file = new OaklogueFile(locals);

    const actions: CallObject[] = [
        {
            $call: "action",
            $path: `BP/dialogue/gm1/ord/${dialogue}.json`,
            $content: file.Content as JSONObject,
        },
        {
            $call: "action",
            $path: `RP/texts/oaklogue.saplang`,
            $content: file.LangContent,
            $lines: true,
        },
    ];

    return actions;
};

export default {
    $inputs: {
        name: false,
        scenes: null,
        langspace: false,
    },
    $identifier: "oaklogue.tree",
    $calls: script,
};
