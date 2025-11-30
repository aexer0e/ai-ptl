import { JSONArray, JSONObject, JSONValue } from "../../Mangrove/Types/JSON";
import FileDependencies from "./FileDependencies";
export * from "../../Mangrove/Types/JSON";

/* Crimson */
export interface Scope {
    objects: ScopeObjects; // Objects
    locals: JSONObject; // Variables
    stack: string[]; // Method Stack
    access?: ScopeAccess;
}

export interface ScopeAccess {
    objects: string[];
    locals: string[];
}

export type PathDependencyMap = { [path: string]: FileDependencies };

export type ScopeObjects = JSONObject & { $labels: JSONObject<JSONArray<JSONObject>> };

export interface MethodAction {
    path: string;
    content: JSONValue;
}

export interface MethodReturn {
    actions?: MethodAction[];
    outputs?: JSONObject;
}

/* Alias */
export type VarDefinition = JSONObject;

/* Template */
export interface TemplateFile extends JSONObject {
    $arguments: string;
    $variables: string;
    $global?: string | string[];
}

export interface TemplateCallObject extends JSONObject {
    $template: string;
}
export type TemplateCallString = string;
export type TemplateCall = TemplateCallObject | TemplateCallString;

export interface VanillaFile extends JSONObject {
    $templates: TemplateCall[];
}

/* Object */
export interface ObjectFile extends JSONObject {
    $identifier: string;
    $dependencies?: string[];
    $versions?: JSONObject[];
    $labels?: string[];
    $method?: string;
}

/* Methods */
export interface MethodFile extends Object {
    $identifier: string;
    $inputs?: JSONObject;
    $calls?: Calls;
    $outputs?: JSONObject;
}

export type Calls = CallObject | CallObject[] | CallFunction;
export type CallFunction = (scope: Scope) => CallObject | CallObject[];
export type CallObject = MethodCallObject | ActionCallObject | VariableCallObject;

export interface MethodCallObject extends JSONObject {
    $method: string;
}

export interface ActionCallObject extends JSONObject {
    $path: string;
    $content: JSONValue;
    $lines?: boolean;
}

export type VariableCallObject = JSONObject;
