import {ObjectUtils} from '../object/object.utils'

/**
 * Runtime helpers for TypeScript-oriented checks and exhaustiveness.
 *
 * Prefer {@link NumberUtils.isFiniteNumber} when validating numeric input
 * (excludes `NaN` / `Infinity`).
 */
export class TypeScriptUtils {
  /**
   * Asserts that a `switch` / discriminated-union branch is unreachable.
   *
   * Call with a value typed as `never` so TypeScript errors if a case is missing.
   *
   * @param value - Value that should be impossible (`never`).
   * @param message - Optional error message.
   * @returns Never returns; always throws.
   * @throws {Error} Always.
   */
  static assertNever(value: never, message = `Unexpected value: ${String(value)}`): never {
    throw new Error(message)
  }

  /**
   * Assertion function: throws if `value` is `null` or `undefined`.
   *
   * Narrows `value` to `NonNullable<T>` for subsequent code.
   *
   * @param value - Value that must be defined.
   * @param message - Optional error message.
   * @throws {Error} If `value` is nullish.
   */
  static assertDefined<T>(value: T, message = 'Expected value to be defined'): asserts value is NonNullable<T> {
    if (value === null || value === undefined) {
      throw new Error(message)
    }
  }

  /**
   * Type guard: `true` when `value` is neither `null` nor `undefined`.
   *
   * @param value - Value to test.
   * @returns `true` if defined.
   */
  static isDefined<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined
  }

  /**
   * Type guard: `true` when `value` is `null` or `undefined`.
   *
   * @param value - Value to test.
   * @returns `true` if nullish.
   */
  static isNil(value: unknown): value is null | undefined {
    return value === null || value === undefined
  }

  /**
   * Emptiness check (not a type guard — too many input shapes).
   *
   * Empty when: `null`/`undefined`, `''`, `[]`, plain `{}` with no own keys, empty `Map`/`Set`.
   * Whitespace strings are **not** empty — use {@link StringUtils.isBlank}.
   * Numbers, booleans, `Date`, and class instances are never empty.
   *
   * @param value - Value to test.
   * @returns `true` if empty per the rules above.
   */
  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true
    }

    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length === 0
    }

    if (value instanceof Map || value instanceof Set) {
      return value.size === 0
    }

    if (ObjectUtils.isPlainObject(value)) {
      return Object.keys(value).length === 0
    }

    return false
  }

  /**
   * Type guard: `typeof value === 'string'`.
   *
   * @param value - Value to test.
   * @returns `true` if `value` is a string.
   */
  static isString(value: unknown): value is string {
    return typeof value === 'string'
  }

  /**
   * Type guard: `typeof value === 'number'` (includes `NaN` and `±Infinity`).
   *
   * Prefer {@link NumberUtils.isFiniteNumber} for numeric validation.
   *
   * @param value - Value to test.
   * @returns `true` if `value` is a number type.
   */
  static isNumber(value: unknown): value is number {
    return typeof value === 'number'
  }

  /**
   * Always throws; typed as `never` for unreachable branches.
   *
   * @param message - Error message.
   * @returns Never returns; always throws.
   * @throws {Error} Always.
   */
  static fail(message = 'Unreachable'): never {
    throw new Error(message)
  }
}
