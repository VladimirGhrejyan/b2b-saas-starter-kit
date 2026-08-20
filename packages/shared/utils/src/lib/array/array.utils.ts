import type {NonEmptyArray} from '../types/non-empty-array'

/** Array helpers for common non-native operations and safer access patterns. */
export class ArrayUtils {
  /**
   * Type guard that narrows an array to {@link NonEmptyArray} when it has at least one element.
   *
   * @param arr - Array to test.
   * @returns `true` if `arr` is non-empty.
   */
  static isNonEmpty<T>(arr: readonly T[]): arr is NonEmptyArray<T> {
    return arr.length > 0
  }

  /**
   * Returns the first element of a non-empty array (always defined).
   *
   * @param arr - Non-empty array.
   * @returns The first element.
   */
  static first<T>(arr: NonEmptyArray<T>): T

  /**
   * Returns the first element, or `undefined` when the array is empty.
   *
   * @param arr - Array to read.
   * @returns The first element, or `undefined`.
   */
  static first<T>(arr: readonly T[]): T | undefined

  static first<T>(arr: readonly T[]): T | undefined {
    return arr[0]
  }

  /**
   * Returns the last element of a non-empty array (always defined).
   *
   * @param arr - Non-empty array.
   * @returns The last element.
   */
  static last<T>(arr: NonEmptyArray<T>): T

  /**
   * Returns the last element, or `undefined` when the array is empty.
   *
   * @param arr - Array to read.
   * @returns The last element, or `undefined`.
   */
  static last<T>(arr: readonly T[]): T | undefined

  static last<T>(arr: readonly T[]): T | undefined {
    return arr[arr.length - 1]
  }

  /**
   * Returns a new array with duplicate values removed (first occurrence wins).
   *
   * Uses `SameValueZero` equality via `Set` (same as `Set` construction).
   *
   * @param arr - Source array.
   * @returns Deduplicated array.
   */
  static unique<T>(arr: readonly T[]): T[] {
    return [...new Set(arr)]
  }

  /**
   * Returns a new array with items unique by the key returned from `keyFn`.
   *
   * First occurrence of each key is kept.
   *
   * @param arr - Source array.
   * @param keyFn - Extracts the uniqueness key for each item.
   * @returns Deduplicated array.
   */
  static uniqueBy<T>(arr: readonly T[], keyFn: (item: T) => unknown): T[] {
    const seen = new Set<unknown>()
    const result: T[] = []

    for (const item of arr) {
      const key = keyFn(item)

      if (!seen.has(key)) {
        seen.add(key)
        result.push(item)
      }
    }

    return result
  }

  /**
   * Groups items by the key returned from `keyFn`.
   *
   * Empty groups are omitted (only keys that appear at least once are present).
   *
   * @param arr - Source array.
   * @param keyFn - Extracts the group key for each item.
   * @returns A record of key → items in encounter order.
   */
  static groupBy<T, K extends PropertyKey>(arr: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
    const result = {} as Record<K, T[]>

    for (const item of arr) {
      const key = keyFn(item)
      const group = result[key] as T[] | undefined

      if (group === undefined) {
        result[key] = [item]
      } else {
        group.push(item)
      }
    }

    return result
  }

  /**
   * Splits an array into `[pass, fail]` using a type predicate.
   *
   * @param arr - Source array.
   * @param predicate - Type guard; matching items go to the first array.
   * @returns Tuple of narrowed matches and excluded items.
   */
  static partition<T, S extends T>(arr: readonly T[], predicate: (item: T) => item is S): [S[], Array<Exclude<T, S>>]

  /**
   * Splits an array into `[pass, fail]` using a boolean predicate.
   *
   * @param arr - Source array.
   * @param predicate - Matching items go to the first array.
   * @returns Tuple of matching and non-matching items.
   */
  static partition<T>(arr: readonly T[], predicate: (item: T) => boolean): [T[], T[]]

  static partition<T>(arr: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
    const pass: T[] = []
    const fail: T[] = []

    for (const item of arr) {
      if (predicate(item)) {
        pass.push(item)
      } else {
        fail.push(item)
      }
    }

    return [pass, fail]
  }

  /**
   * Splits an array into contiguous chunks of at most `size` elements.
   *
   * @param arr - Source array.
   * @param size - Positive integer chunk size.
   * @returns Array of chunks (last chunk may be shorter).
   * @throws {RangeError} If `size` is not a positive integer.
   */
  static chunk<T>(arr: readonly T[], size: number): T[][] {
    if (!Number.isInteger(size) || size < 1) {
      throw new RangeError(`chunk size must be a positive integer, received ${size}`)
    }

    const result: T[][] = []

    for (let index = 0; index < arr.length; index += size) {
      result.push(arr.slice(index, index + size))
    }

    return result
  }

  /**
   * Returns a new array with `null` and `undefined` entries removed.
   *
   * @param arr - Source array that may contain nullish values.
   * @returns Array of defined values.
   */
  static compact<T>(arr: readonly (T | null | undefined)[]): T[] {
    const result: T[] = []

    for (const item of arr) {
      if (item !== null && item !== undefined) {
        result.push(item)
      }
    }

    return result
  }

  /**
   * Maps each item and drops results that are `null` or `undefined` (single pass).
   *
   * @param arr - Source array.
   * @param fn - Mapper that may return nullish to skip the item.
   * @returns Array of non-nullish mapped values.
   */
  static filterMap<T, U>(arr: readonly T[], fn: (item: T) => U | null | undefined): U[] {
    const result: U[] = []

    for (const item of arr) {
      const mapped = fn(item)

      if (mapped !== null && mapped !== undefined) {
        result.push(mapped)
      }
    }

    return result
  }
}
