/**
 * Finite / integer / range helpers.
 *
 * Prefer these over {@link TypeScriptUtils.isNumber} when validating numeric input
 * (`isNumber` allows `NaN` and `±Infinity`).
 */
export class NumberUtils {
  /**
   * Type guard: `typeof value === 'number'` and `Number.isFinite(value)`.
   *
   * @param value - Value to test.
   * @returns `true` if `value` is a finite number.
   */
  static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
  }

  /**
   * Type guard: `typeof value === 'number'` and `Number.isInteger(value)`.
   *
   * @param value - Value to test.
   * @returns `true` if `value` is an integer number.
   */
  static isInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value)
  }

  /**
   * Returns whether `value` lies in the inclusive range `[min, max]`.
   *
   * @param value - Number to test.
   * @param min - Inclusive lower bound.
   * @param max - Inclusive upper bound.
   * @returns `true` if `min <= value <= max`.
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max
  }

  /**
   * Clamps `value` into the inclusive range `[min, max]`.
   *
   * @param value - Number to clamp.
   * @param min - Inclusive lower bound.
   * @param max - Inclusive upper bound.
   * @returns Clamped number.
   * @throws {RangeError} If `min > max`.
   */
  static clamp(value: number, min: number, max: number): number {
    if (min > max) {
      throw new RangeError(`clamp min (${min}) must be <= max (${max})`)
    }

    return Math.min(Math.max(value, min), max)
  }

  /**
   * Parses a finite number from `unknown`.
   *
   * Accepts finite numbers and numeric strings (after trim). Returns `undefined`
   * for empty strings, `NaN`, `±Infinity`, and non-numeric input.
   *
   * @param value - Value to parse.
   * @returns A finite number, or `undefined`.
   */
  static parseFinite(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()

      if (trimmed.length === 0) {
        return undefined
      }

      const parsed = Number(trimmed)

      return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
  }
}
