/**
 * Makes the listed keys required on `T`.
 *
 * @typeParam T - Object shape.
 * @typeParam K - Keys to make required.
 */
export type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]}
