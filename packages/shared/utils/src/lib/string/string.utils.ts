/**
 * Generic string helpers (blank checks, truncation, conservative ASCII casing).
 * Casing splits on spaces, underscores, hyphens, and camelCase boundaries only.
 */
export class StringUtils {
  /**
   * Returns whether `value` is `null`, `undefined`, or whitespace-only.
   *
   * @param value - String or nullish value to test.
   * @returns `true` if blank.
   */
  static isBlank(value: string | null | undefined): boolean {
    return value === null || value === undefined || value.trim().length === 0
  }

  /**
   * Type guard: `true` when `value` is a non-blank string.
   *
   * @param value - String or nullish value to test.
   * @returns `true` if `value` is a usable non-blank string.
   */
  static isNotBlank(value: string | null | undefined): value is string {
    return !StringUtils.isBlank(value)
  }

  /**
   * Trims `value` and returns `undefined` when the result is empty / blank.
   *
   * Useful for forms and config where blank input should be treated as absent.
   *
   * @param value - String or nullish value.
   * @returns Trimmed string, or `undefined`.
   */
  static trimToUndefined(value: string | null | undefined): string | undefined {
    if (value === null || value === undefined) {
      return undefined
    }

    const trimmed = value.trim()

    return trimmed.length === 0 ? undefined : trimmed
  }

  /**
   * Truncates `value` to at most `maxLength` characters, appending `omission` when truncated.
   *
   * @param value - Source string.
   * @param maxLength - Non-negative integer maximum length of the result (including omission).
   * @param omission - Suffix when truncated (default `…`).
   * @returns Original string or truncated string with omission.
   * @throws {RangeError} If `maxLength` is not a non-negative integer.
   */
  static truncate(value: string, maxLength: number, omission = '…'): string {
    if (!Number.isInteger(maxLength) || maxLength < 0) {
      throw new RangeError(`maxLength must be a non-negative integer, received ${maxLength}`)
    }

    if (value.length <= maxLength) {
      return value
    }

    if (omission.length >= maxLength) {
      return omission.slice(0, maxLength)
    }

    return `${value.slice(0, maxLength - omission.length)}${omission}`
  }

  /**
   * Uppercases the first character; leaves the rest unchanged.
   *
   * @param value - Source string.
   * @returns Capitalized string (empty input returns empty).
   */
  static capitalize(value: string): string {
    if (value.length === 0) {
      return value
    }

    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
  }

  /**
   * Converts a string to `camelCase` (ASCII / separator / camelCase-boundary split only).
   *
   * @param value - Source string.
   * @returns camelCase form.
   */
  static toCamelCase(value: string): string {
    const words = StringUtils.splitWords(value)

    if (words.length === 0) {
      return ''
    }

    const [first = '', ...rest] = words

    return first + rest.map((word) => StringUtils.capitalize(word)).join('')
  }

  /**
   * Converts a string to `PascalCase` (ASCII / separator / camelCase-boundary split only).
   *
   * @param value - Source string.
   * @returns PascalCase form.
   */
  static toPascalCase(value: string): string {
    return StringUtils.splitWords(value)
      .map((word) => StringUtils.capitalize(word))
      .join('')
  }

  /**
   * Converts a string to `kebab-case` (ASCII / separator / camelCase-boundary split only).
   *
   * @param value - Source string.
   * @returns kebab-case form.
   */
  static toKebabCase(value: string): string {
    return StringUtils.splitWords(value).join('-')
  }

  /**
   * Converts a string to `snake_case` (ASCII / separator / camelCase-boundary split only).
   *
   * @param value - Source string.
   * @returns snake_case form.
   */
  static toSnakeCase(value: string): string {
    return StringUtils.splitWords(value).join('_')
  }

  /**
   * Splits a string into lowercase word segments for casing transforms.
   *
   * @param value - Source string.
   * @returns Lowercase word list.
   */
  private static splitWords(value: string): string[] {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_\s]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word.toLowerCase())
  }
}
