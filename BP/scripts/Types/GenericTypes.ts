export type Maybe<T> = T | null | undefined;

export type MergeUnion<T> = {
    [K in T extends infer U ? keyof U : never]: T extends Record<K, infer V> ? V : never;
};

export type ObjectEntries<K extends string, T extends object> = T extends {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [key in K]: infer E;
}
    ? E
    : never;
