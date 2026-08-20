/** Explicit nullability (`T | null`), distinct from `undefined`. */
export type Nullable<T> = T | null

/** Null or undefined at API boundaries (`T | null | undefined`). */
export type Nullish<T> = T | null | undefined
