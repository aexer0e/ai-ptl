import { Command } from "../CustomCommands";

class BuildInfo implements Command {
    getDescription = (): string => "Provide build info for this build";
    getPrefix = (): string => "ns_ptl:debug";
    getNames = (): string[] => ["buildinfo", "version"];
    getUsage = (): string[] => ["buildinfo"];

    run() {
        BroadcastUtil.say([{ translate: "build.title" }]);
        BroadcastUtil.say([
            { translate: "build.versionTitle" },
            { text: ": " },
            { translate: "build.version" },
            { text: ", " },
            { translate: "build.idTitle" },
            { text: ": " },
            { translate: "build.id" },
        ]);
        BroadcastUtil.say([{ translate: "build.commitSHATitle" }, { text: ": " }, { translate: "build.commitSHA" }]);
    }
}

export default BuildInfo;
