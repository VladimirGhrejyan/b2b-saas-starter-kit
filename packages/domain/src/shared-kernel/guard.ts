import type {DomainError} from './domain-error'

/**
 * Assertion helpers for aggregate invariants.
 *
 * Throws the provided {@link DomainError}. Do not import `@b2b-saas-starter-kit/utils`.
 */
export class Guard {
  /**
   * Throws `error` when `value` is empty or whitespace-only.
   *
   * @param value - String that must contain a non-blank value.
   * @param error - Domain error to throw on failure.
   * @throws {DomainError} When `value` is blank.
   */
  static againstEmpty(value: string, error: DomainError): void {
    if (value.trim() === '') {
      throw error
    }
  }

  /**
   * Throws `error` when `value` is `null` or `undefined`.
   *
   * @param value - Value that must be defined.
   * @param error - Domain error to throw on failure.
   * @throws {DomainError} When `value` is nullish.
   */
  static againstNil(value: unknown, error: DomainError): void {
    if (value === null || value === undefined) {
      throw error
    }
  }
}
