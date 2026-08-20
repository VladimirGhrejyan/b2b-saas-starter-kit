/**
 * Requires at least one of the listed keys to be present (and required).
 * Useful for patch/update payloads where empty objects are invalid.
 *
 * @typeParam T - Object shape.
 * @typeParam Keys - Keys of which at least one must be set.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]
