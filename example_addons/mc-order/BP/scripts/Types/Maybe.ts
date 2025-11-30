/**
 * A type that represents a value that can either be of type `T`, `null`, or `undefined`.
 * Used for cases where a value might be optional or missing.
 *
 * @template T - The type of the value that might be present.
 */
export type Maybe<T> = T | null | undefined;
