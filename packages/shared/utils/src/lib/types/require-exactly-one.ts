/**
 * Requires exactly one of the listed keys to be present (XOR-style options).
 *
 * @typeParam T - Object shape.
 * @typeParam Keys - Keys of which exactly one must be set.
 */
export type RequireExactlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>
  }[Keys]
