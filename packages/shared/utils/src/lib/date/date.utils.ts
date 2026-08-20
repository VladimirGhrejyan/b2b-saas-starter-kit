/**
 * UTC/ISO-oriented date helpers. No local-timezone calendar APIs.
 *
 * - {@link DateUtils.parseIso} returns `undefined` for invalid input.
 * - Arithmetic / day-bound helpers throw if the input `Date` is invalid.
 */
export class DateUtils {
  /**
   * Returns whether `value` is a valid `Date` (not an Invalid Date).
   *
   * @param value - Date instance to test.
   * @returns `true` if `value.getTime()` is not `NaN`.
   */
  static isValid(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime())
  }

  /**
   * Parses an ISO-8601 (or Date-parseable) string into a `Date`.
   *
   * @param value - Date/time string.
   * @returns A valid `Date`, or `undefined` if parsing yields an Invalid Date.
   */
  static parseIso(value: string): Date | undefined {
    const parsed = new Date(value)

    return DateUtils.isValid(parsed) ? parsed : undefined
  }

  /**
   * Serializes a valid `Date` to an ISO-8601 UTC string (`Date.prototype.toISOString`).
   *
   * @param value - Valid date.
   * @returns ISO string in UTC.
   * @throws {RangeError} If `value` is an Invalid Date.
   */
  static toIsoString(value: Date): string {
    DateUtils.assertValid(value)

    return value.toISOString()
  }

  /**
   * Creates a `Date` from a Unix timestamp in milliseconds.
   *
   * @param ms - Finite epoch milliseconds.
   * @returns Corresponding `Date`.
   * @throws {RangeError} If `ms` is not finite or yields an Invalid Date.
   */
  static fromUnixMs(ms: number): Date {
    if (!Number.isFinite(ms)) {
      throw new RangeError(`fromUnixMs expects a finite number, received ${ms}`)
    }

    const date = new Date(ms)

    DateUtils.assertValid(date)

    return date
  }

  /**
   * Returns the Unix timestamp in milliseconds for a valid `Date`.
   *
   * @param value - Valid date.
   * @returns Epoch milliseconds.
   * @throws {RangeError} If `value` is an Invalid Date.
   */
  static toUnixMs(value: Date): number {
    DateUtils.assertValid(value)

    return value.getTime()
  }

  /**
   * Returns a new `Date` at `00:00:00.000` UTC on the same calendar day as `value`.
   *
   * @param value - Valid date.
   * @returns Start of the UTC day.
   * @throws {RangeError} If `value` is an Invalid Date.
   */
  static startOfUtcDay(value: Date): Date {
    DateUtils.assertValid(value)

    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  }

  /**
   * Returns a new `Date` at `23:59:59.999` UTC on the same calendar day as `value`.
   *
   * @param value - Valid date.
   * @returns End of the UTC day.
   * @throws {RangeError} If `value` is an Invalid Date.
   */
  static endOfUtcDay(value: Date): Date {
    DateUtils.assertValid(value)

    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999))
  }

  /**
   * Adds (or subtracts) whole UTC days by millisecond arithmetic.
   *
   * @param value - Valid date.
   * @param days - Number of days to add (may be negative).
   * @returns New `Date` shifted by `days`.
   * @throws {RangeError} If `value` is invalid or the duration is not finite.
   */
  static addUtcDays(value: Date, days: number): Date {
    return DateUtils.addUtcMs(value, days * 24 * 60 * 60 * 1000)
  }

  /**
   * Adds (or subtracts) UTC hours by millisecond arithmetic.
   *
   * @param value - Valid date.
   * @param hours - Number of hours to add (may be negative).
   * @returns New `Date` shifted by `hours`.
   * @throws {RangeError} If `value` is invalid or the duration is not finite.
   */
  static addUtcHours(value: Date, hours: number): Date {
    return DateUtils.addUtcMs(value, hours * 60 * 60 * 1000)
  }

  /**
   * Adds (or subtracts) UTC minutes by millisecond arithmetic.
   *
   * @param value - Valid date.
   * @param minutes - Number of minutes to add (may be negative).
   * @returns New `Date` shifted by `minutes`.
   * @throws {RangeError} If `value` is invalid or the duration is not finite.
   */
  static addUtcMinutes(value: Date, minutes: number): Date {
    return DateUtils.addUtcMs(value, minutes * 60 * 1000)
  }

  /**
   * Signed difference `a - b` in milliseconds.
   *
   * @param a - Valid date (minuend).
   * @param b - Valid date (subtrahend).
   * @returns Milliseconds difference.
   * @throws {RangeError} If either date is invalid.
   */
  static diffUtcMs(a: Date, b: Date): number {
    DateUtils.assertValid(a)
    DateUtils.assertValid(b)

    return a.getTime() - b.getTime()
  }

  /**
   * Compares two valid dates for sorting (`-1` | `0` | `1`).
   *
   * @param a - First date.
   * @param b - Second date.
   * @returns `-1` if `a < b`, `0` if equal, `1` if `a > b`.
   * @throws {RangeError} If either date is invalid.
   */
  static compare(a: Date, b: Date): -1 | 0 | 1 {
    const diff = DateUtils.diffUtcMs(a, b)

    if (diff < 0) {
      return -1
    }

    if (diff > 0) {
      return 1
    }

    return 0
  }

  /**
   * Adds a millisecond delta to a valid date.
   *
   * @param value - Valid date.
   * @param ms - Finite millisecond delta.
   * @returns New `Date`.
   * @throws {RangeError} If `value` is invalid or `ms` is not finite.
   */
  private static addUtcMs(value: Date, ms: number): Date {
    DateUtils.assertValid(value)

    if (!Number.isFinite(ms)) {
      throw new RangeError(`duration must be finite, received ${ms}`)
    }

    return new Date(value.getTime() + ms)
  }

  /**
   * Throws if `value` is not a valid `Date`.
   *
   * @param value - Date to validate.
   * @throws {RangeError} If `value` is an Invalid Date.
   */
  private static assertValid(value: Date): void {
    if (!DateUtils.isValid(value)) {
      throw new RangeError('Invalid Date')
    }
  }
}
