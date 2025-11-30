import { JSONObject, JSONValue } from "./JSON";

/*  Types created manually from the following source:
    https://github.com/bridge-core/dash-compiler/blob/4a320513ca258f91a553103bf838ee91feb8efc5/src/Plugins/BuiltIn/Components/Component.ts#L286-L383
*/

export interface Context {
    mode: Environment;
    compilerMode: Environment;
    location: string;
    identifier: string;
    projectNamespace: string;
    create: (data: JSONValue, location?: string, operation?: Operation) => void;
    lootTable: (lootTableDef: JSONObject) => string;
}

export interface EntityContext extends Context {
    sourceEntity: () => JSONObject;
    animationController: (animationController: JSONObject, molangCondition?: string) => string;
    animation: (animation: JSONObject, molangCondition?: string) => string;
    tradeTable: (tradeTableDef: JSONObject) => string;
    spawnRule: (spawnRuleDef: JSONObject) => void;
    dialogueScene: (scene: JSONObject, openDialogue?: boolean) => void;
    onActivated: (eventResponse: JSONObject) => void;
    onDeactivated: (eventResponse: JSONObject) => void;
    client: {
        create: (clientEntity: JSONObject, formatVersion?: string) => void;
    };
}

export interface ItemContext extends Context {
    sourceItem: () => JSONObject;
    recipe: (recipeDef: JSONObject) => void;
    player: {
        animationController: (animationController: JSONObject, molangCondition?: string) => string;
        animation: (animation: JSONObject, molangCondition?: string) => string;
        create: (data: JSONValue, location?: string, operation?: Operation) => void;
    };
}

export interface BlockContext extends Context {
    sourceBlock: () => JSONObject;
    recipe: (recipeDef: JSONObject) => void;
}

export type Environment = "development" | "production";
export type Operation = (deepMerge: Function, oldData: JSONObject, newData: JSONObject) => JSONValue;
