/**
 * Thrown when the same Idempotency-Key is reused with a different request payload.
 */
export class IdempotencyKeyReusedError extends Error {
  readonly code = 'IDEMPOTENCY_KEY_REUSED'

  constructor() {
    super('Idempotency-Key was already used with a different request')
    this.name = new.target.name
  }
}
