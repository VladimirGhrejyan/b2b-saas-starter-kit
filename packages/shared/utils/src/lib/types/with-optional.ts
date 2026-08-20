/**
 * Makes the listed keys optional on `T`.
 *
 * @typeParam T - Object shape.
 * @typeParam K - Keys to make optional.
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
