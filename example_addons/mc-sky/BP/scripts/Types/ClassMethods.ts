export type ClassMethods<T> = {
    [K in keyof T]: T[K];
};
