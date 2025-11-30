export type JSONLiteral = string | number | boolean;

export type JSONValue = JSONLiteral | JSONObject | JSONArray<JSONValue> | null | undefined;
export interface JSONArray<T extends JSONValue = JSONValue> extends Array<T> {}
export interface JSONObject<T extends JSONValue = JSONValue> extends Record<string, T> {}
