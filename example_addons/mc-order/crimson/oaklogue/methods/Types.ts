// Vanilla
export interface Rawtext {
    text?: string;
    translate?: string;
}

export type TextOrRawtext = string | { rawtext: Rawtext[] } | Rawtext;

export interface VanillaButton {
    name: TextOrRawtext;
    commands: string[];
}

export interface VanillaScene {
    scene_tag: string;
    npc_name?: TextOrRawtext;
    text?: TextOrRawtext;
    on_open_commands?: string[];
    on_close_commands?: string[];
    buttons?: VanillaButton[];
}

// Oaklogue
export interface TextScene {
    text: string;
    options: {
        text: TextOrRawtext;
        scene: string;
        speaker?: string;
        commands: string[];
    }[];
    on_open: string[];
    on_close: string[];
}

export interface SelectorScene {
    scene: string;
    speaker?: string;
    conditions: SelectorSceneCondition[] | SelectorSceneCondition;
}

export type OaklogueScene = TextScene | SelectorScene;

export interface SelectorSceneCondition {
    scene: string;
    selectors?: string[];
    speaker?: string;
}
