/**
 * Thrown when a concurrent request with the same key is still in flight.
 */
export class IdempotencyInProgressError extends Error {
  readonly code = 'IDEMPOTENCY_IN_PROGRESS'

  constructor() {
    super('A request with this Idempotency-Key is already in progress')
    this.name = new.target.name
  }
}
