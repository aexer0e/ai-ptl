import Utils from "../../../.bridge/extensions/WoodenTools/Crimson/Source/Utils";
import { OaklogueScene, SelectorScene, SelectorSceneCondition, TextOrRawtext, TextScene, VanillaButton, VanillaScene } from "./Types";

export default class OaklogueFile {
    private identifier: string;
    private name: string;
    private lang: string[] = [];
    private langspace: string | false = false;

    private oaklogueScenes: { [tag: string]: OaklogueScene } = {};
    private vanillaScenes: object[] = [];

    constructor(content: object) {
        this.identifier = content["$object"];
        this.name = content["name"];
        this.oaklogueScenes = content["scenes"];
        this.langspace = content["langspace"] ?? false;

        this.processScenes();
    }

    public addToLang(text: string, address: string, langspace: string) {
        const line = text.replaceAll("\n", "~LINEBREAK~");
        const hash = this.hash(address);
        const hashWithLangspace = langspace ? `${langspace}.${hash}` : hash;
        const key = `oaklogue.${hashWithLangspace}`;

        this.lang.push(`${key}=${line}`);

        return { translate: key };
    }

    public hash(data: string | number) {
        // Convert to string
        data = data.toString();
        if (data.length === 0) return "0";

        // Generate hash
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = (hash << 5) - hash + char;
        }

        // Convert to base 36 and pad with "0" to ensure length is 7.
        return (hash >>> 0).toString(26).padStart(7, "0");
    }

    public processScenes() {
        const selectorScenes: { [tag: string]: SelectorScene } = {};
        const textScenes: { [tag: string]: TextScene } = {};

        // Sort scenes into selector and dialogue
        for (const tag in this.oaklogueScenes) {
            const scene = this.oaklogueScenes[tag];
            const type = scene["type"] ?? "text";

            if (type == "selector") selectorScenes[tag] = scene as SelectorScene;
            else if (type == "text") textScenes[tag] = scene as TextScene;
        }

        // Process selector scenes
        for (const tag in selectorScenes) this.processSelectorScene(tag, selectorScenes[tag]);

        // Process text scenes
        for (const tag in textScenes) this.processTextScene(tag, textScenes[tag]);

        // Return as stringified JSON
        return this.toString();
    }

    private processSelectorScene(sceneTag: string, scene: SelectorScene) {
        let conditions = scene.conditions ?? [];
        conditions = Utils.ensureArray(conditions) as SelectorSceneCondition[];

        sceneTag = `${this.identifier}:${sceneTag}`;

        // Add default condition
        const speaker = scene.speaker ?? "@s";
        conditions.push({ scene: scene.scene, speaker: speaker });

        // Add identifier to tags
        for (const i in conditions) {
            const tag = conditions[i].scene;
            if (!tag.includes(":")) conditions[i].scene = `${this.identifier}:${tag}`;
        }

        const vanillaScene = {
            scene_tag: sceneTag,
            npc_name: this.name,
            text: { rawtext: [{ translate: "oaklogue.error" }] },
            buttons: [{ name: { rawtext: [{ translate: "oaklogue.exit" }] } }],
            on_open_commands: [
                `/scriptevent gm1:oaklogue open ${sceneTag}`,
                `/scriptevent gm1:oaklogue selector ${JSON.stringify(conditions)}`,
            ],
            on_close_commands: [`/scriptevent gm1:oaklogue close ${sceneTag}`],
        };

        this.vanillaScenes.push(vanillaScene);
    }

    private processTextScene(sceneTag: string, scene: TextScene) {
        // Read keys from scene
        const text = scene["text"] ?? "";
        const options = scene["options"] ?? [];
        const onOpen = scene["on_open"] ?? [];
        const onClose = scene["on_close"] ?? [];
        const name = scene["name"] ?? this.name;
        const audience = scene["audience"] ?? {};
        const langspace = scene["langspace"] ?? this.langspace;

        // Add identifier to tag
        sceneTag = `${this.identifier}:${sceneTag}`;

        // Modify commands
        onOpen.push(`/scriptevent gm1:oaklogue open ${sceneTag}`);
        onClose.push(`/scriptevent gm1:oaklogue close ${sceneTag}`);

        // Handle audience
        if (!audience.selectors) audience.selectors = [];
        if (!audience.focus) audience.focus = "@initiator";

        onOpen.push(`/tp @s ~ ~ ~ facing ${audience.focus ?? "@initiator"}`);

        if (audience.selectors.length > 0) {
            onOpen.push(`/tag @s add oaklogue.speaker`);
            for (const selector of audience.selectors) {
                onOpen.push(`/execute as ${selector} at @s run tp @s ~ ~ ~ facing @e[tag=oaklogue.speaker,c=1]`);
                onOpen.push(`/execute as ${selector} at @s run tp @s ~ ~ ~ ~ -15`);
            }
            onOpen.push(`/tag @s remove oaklogue.speaker`);
        }

        // Build buttons
        const buttons: VanillaButton[] = [];

        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const commands = option.commands ?? [];
            const text = option.text;

            let nextSceneTag = option.scene;
            if (nextSceneTag) {
                if (!nextSceneTag.includes(":")) nextSceneTag = `${this.identifier}:${nextSceneTag}`;
                const speaker = option.speaker ?? "@s";
                commands.push(`dialogue open ${speaker} @initiator ${nextSceneTag}`);
            }

            // Support rawtext
            const button: VanillaButton = {
                name: this.ensureRawText(text, `${sceneTag}.button.${i}`, `${langspace}.npc_button`),
                commands: commands.map((c) => "/" + c),
            };

            buttons.push(button);
        }

        const outputScene: VanillaScene = {
            scene_tag: sceneTag,
            npc_name: this.ensureRawText(name, `${sceneTag}.name`, langspace),
            text: this.ensureRawText(text, `${sceneTag}.text`, langspace),
            on_open_commands: onOpen,
            on_close_commands: onClose,
        };

        if (buttons.length > 0) outputScene.buttons = buttons;

        this.vanillaScenes.push(outputScene);
    }

    private ensureRawText(text: TextOrRawtext, address: string, langspace: string): TextOrRawtext {
        if (typeof text === "string") return { rawtext: [this.addToLang(text, address, langspace)] };
        if ("rawtext" in text) return text;
        return { rawtext: [text] };
    }

    public get Content() {
        return {
            format_version: "1.17",
            "minecraft:npc_dialogue": {
                scenes: this.vanillaScenes,
            },
        };
    }

    public get LangContent() {
        return this.lang.join("\n");
    }
}
