/**
 * Thrown when a rate-limit consume is denied.
 */
export class RateLimitExceededError extends Error {
  readonly code = 'RATE_LIMIT_EXCEEDED'

  constructor(readonly retryAfterSeconds: number) {
    super('Too many requests')
    this.name = new.target.name
  }
}
