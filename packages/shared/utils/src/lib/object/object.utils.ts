import type {ObjectValue} from '../types/object-value'

/**
 * Object helpers with stronger typing than native `Object.keys` / `values` / `entries`.
 *
 * Typed key/value/entry APIs are pragmatic: runtime objects may have extra enumerable
 * keys, and `keyof T` includes optional keys that may be missing at runtime.
 */
export class ObjectUtils {
  /**
   * Returns the object's own enumerable string keys, typed as `keyof T`.
   *
   * Stronger than `Object.keys` (`string[]`); not fully sound for all JS objects
   * (extra runtime keys, optional properties, symbols).
   *
   * @param obj - Source object.
   * @returns Array of typed keys.
   */
  static keys<T extends object>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>
  }

  /**
   * Returns the object's own enumerable values, typed as `ObjectValue<T>`.
   *
   * Stronger than `Object.values`; not fully sound for all JS objects.
   *
   * @param obj - Source object.
   * @returns Array of typed values.
   */
  static values<T extends object>(obj: T): Array<ObjectValue<T>> {
    return Object.values(obj) as Array<ObjectValue<T>>
  }

  /**
   * Returns the object's own enumerable entries as `[keyof T, ObjectValue<T>]` pairs.
   *
   * Stronger than `Object.entries`; not fully sound for all JS objects.
   *
   * @param obj - Source object.
   * @returns Array of typed `[key, value]` tuples.
   */
  static entries<T extends object>(obj: T): Array<[keyof T, ObjectValue<T>]> {
    return Object.entries(obj) as Array<[keyof T, ObjectValue<T>]>
  }

  /**
   * Checks whether `key` is an own property of `obj` (not inherited).
   *
   * Narrows `obj` so that `key` is known to exist when the guard passes.
   *
   * @param obj - Object to inspect.
   * @param key - Property key to check.
   * @returns `true` if `key` is an own property of `obj`.
   */
  static hasOwn<T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> {
    return Object.hasOwn(obj, key)
  }

  /**
   * Returns whether `value` is a plain data object (`{}` / `Object.create(null)`).
   *
   * Returns `false` for `null`, arrays, and class instances.
   *
   * @param value - Value to test.
   * @returns `true` if `value` is a plain object.
   */
  static isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') {
      return false
    }

    const prototype: unknown = Object.getPrototypeOf(value)

    return prototype === Object.prototype || prototype === null
  }

  /**
   * Returns a new object containing only the listed own keys from `obj`.
   *
   * Keys that are not own properties of `obj` are skipped.
   *
   * @param obj - Source object.
   * @param keys - Keys to keep.
   * @returns A `Pick` of `obj` for the requested keys.
   */
  static pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
    const result = {} as Pick<T, K>

    for (const key of keys) {
      if (Object.hasOwn(obj, key)) {
        result[key] = obj[key]
      }
    }

    return result
  }

  /**
   * Returns a new object with the listed keys removed from `obj`.
   *
   * @param obj - Source object.
   * @param keys - Keys to exclude.
   * @returns An `Omit` of `obj` without the requested keys.
   */
  static omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
    const excluded = new Set<PropertyKey>(keys)
    const result = {} as Omit<T, K>

    for (const key of ObjectUtils.keys(obj)) {
      if (!excluded.has(key)) {
        ;(result as T)[key] = obj[key]
      }
    }

    return result
  }

  /**
   * Builds a record from an iterable of `[key, value]` entries.
   *
   * Typed alternative to `Object.fromEntries`.
   *
   * @param entries - Key/value pairs.
   * @returns A record keyed by `K` with values of type `V`.
   */
  static fromEntries<K extends PropertyKey, V>(entries: Iterable<readonly [K, V]>): Record<K, V> {
    return Object.fromEntries(entries) as Record<K, V>
  }

  /**
   * Shallow, immutable merge of plain objects. Later sources overwrite earlier keys.
   *
   * Nested objects are replaced by reference (not deep-merged). Inputs are never mutated.
   *
   * @param target - Base object.
   * @param source - Object whose own enumerable properties overwrite `target`.
   * @returns A new object typed as `T & U`.
   */
  static merge<T extends object, U extends object>(target: T, source: U): T & U

  /**
   * Shallow, immutable merge of plain objects. Later sources overwrite earlier keys.
   *
   * Nested objects are replaced by reference (not deep-merged). Inputs are never mutated.
   *
   * @param target - Base object.
   * @param sources - Objects whose own enumerable properties overwrite previous keys.
   * @returns A new object starting from `target` with sources applied left-to-right.
   */
  static merge<T extends object>(target: T, ...sources: object[]): T

  static merge<T extends object>(target: T, ...sources: object[]): T {
    return Object.assign({}, target, ...sources) as T
  }
}
