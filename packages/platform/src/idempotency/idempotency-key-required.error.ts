/**
 * Thrown when an `@Idempotent()` route is missing `Idempotency-Key`.
 */
export class IdempotencyKeyRequiredError extends Error {
  readonly code = 'IDEMPOTENCY_KEY_REQUIRED'

  constructor() {
    super('Idempotency-Key header is required')
    this.name = new.target.name
  }
}
