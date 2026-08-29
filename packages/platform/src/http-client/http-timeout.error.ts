/**
 * Thrown when the overall request deadline elapses.
 */
export class HttpTimeoutError extends Error {
  readonly code = 'HTTP_TIMEOUT'

  constructor() {
    super('Outbound HTTP request timed out')
    this.name = new.target.name
  }
}
