/**
 * Thrown when an `@Idempotent()` route has no tenant or actor to scope the key.
 */
export class IdempotencyScopeUnavailableError extends Error {
  readonly code = 'IDEMPOTENCY_SCOPE_UNAVAILABLE'

  constructor() {
    super('Idempotency requires an authenticated actor or tenant')
    this.name = new.target.name
  }
}
